import { ARCHETYPE_BY_ID } from '../config/archetypes';
import type {
    AugmentDef,
    ManaProfile,
    Scaling,
    UnitDef,
} from '../config/types';
import { UNIT_BY_ID, starScale } from '../config/units';
import {
    ABLATIVE_ARMOR_CAP,
    ABLATIVE_ARMOR_PER_HIT,
    BULKHEAD_HP_THRESHOLD,
    BULKHEAD_SHIELD_FRAC,
    BUNKER_ARMOR_PER_SEC,
    BUNKER_AS_PER_SEC,
    COOLANT_HEAL_FRAC,
    COOLANT_MANA_MULT,
    ECHO_DELAY,
    ECHO_POWER,
    FIREWALL_DISCORD,
    FIREWALL_DISCORD_DURATION,
    FIREWALL_SHIELD,
    FLYWHEEL_PER_SEC,
    FOUNDRY_HP_FRAC,
    GATLING_DAMAGE_MULT,
    GROUNDING_MANA,
    HYBRID_ATTACKS,
    HYBRID_BONUS,
    INDUCTION_MANA,
    KERNEL_AP_PER_CAST,
    KINETIC_EVERY,
    KINETIC_SLOW,
    KINETIC_SLOW_DURATION,
    OVERHEAT_AS_PER_STACK,
    OVERHEAT_BURN_RATE,
    OVERHEAT_SELF_HP_FRAC,
    OVERHEAT_STACK_CAP,
    PRECHARGED_DISCOUNT,
    PREDICTIVE_AS,
    PREDICTIVE_DURATION,
    REPAIR_HEAL,
    SALVAGE_ATK,
    SALVAGE_HEAL_FRAC,
    VOLTAGE_DMG_PER_MANA,
    VOLTAGE_MANA_BURN,
    aggregateItemStats,
    createItemRuntime,
    hasItemEffect,
    itemsFor,
} from './items';
import { resolveScaling } from './scaling';
import {
    BOARD_COLS,
    BOARD_ROWS,
    cellKey,
    cellsWithin,
    hexDistance,
    inBounds,
    neighbors,
    stepToward,
} from './grid';
import {
    GUARDIAN_REVIVE_DELAY,
    GUARDIAN_REVIVE_PCT,
    SURGE_RAMP_INTERVAL,
    ZERO_DAY_MANA_PENALTY,
    baseMods,
    computeTeamMods,
    hasPrime,
} from './traits';
import type {
    CombatState,
    CombatUnit,
    PlacedUnit,
    SweepChannel,
    Team,
} from './types';

/** Seconds between movement steps. */
const MOVE_INTERVAL = 0.5;
/** Armor effectiveness against ability damage. */
const ABILITY_ARMOR_EFF = 0.5;
/** Duration of Discord applied by attacks (Amplifier). */
const DISCORD_DURATION = 4;
/** Seconds between death and a Hardlight re-form. */
const REFORM_DELAY = 2;
/** Cap on Turret stationary attack-speed stacks. */
const TURRET_STACK_CAP = 1.5;
/** Bonus-damage window after empower / valkyrie casts. */
const EMPOWER_DURATION = 5;
const VALKYRIE_DURATION = 4;
/** Fraction of shell damage splashed to hexes adjacent to each impact. */
const SHELL_SPLASH = 0.5;
/** Snipe bonus damage per hex of distance. */
const SNIPE_PER_HEX = 0.08;
/** Aura reach in hexes. */
const AURA_RADIUS = 2;
/** Scorch burn: duration and tick rate. */
const BURN_DURATION = 3;
const BURN_TICK = 0.5;
/** Rally: attack-speed bonus and duration. */
const RALLY_ATK_SPEED = 0.25;
const RALLY_DURATION = 3;
/** Seconds a Concussive Volley daze slows its victims. */
const CONCUSSIVE_SLOW_DURATION = 2;
/** Floor on the attack-speed multiplier under slows. */
const MIN_SPEED_FACTOR = 0.2;
/** Fraction of the attack cleaved to a second enemy by Storm Gauntlet. */
const CLEAVE_FRACTION = 0.6;
/** Safety cap on kill-recast chains (flicker/guillotine). */
const RECAST_CAP = 10;

/** Mana profile of a unit's archetype. */
function manaProfile(def: UnitDef): ManaProfile {
    return ARCHETYPE_BY_ID.get(def.archetype)!.mana;
}

/** Options for {@link createCombat}. */
export interface CombatOptions {
    player: PlacedUnit[];
    enemy: PlacedUnit[];
    /** Player augments; enemies never have augments. */
    augments: AugmentDef[];
    /** Multiplier on enemy hp/atk (floor scaling × elite scaling). */
    enemyStatScale: number;
    /** Deterministic RNG in [0, 1). */
    rng: () => number;
}

/**
 * Builds the initial combat state for a battle round.
 *
 * Handles pre-combat trait setup: Aegisline barriers, Flanker backline
 * deployment, Zero-Day mana drain on the opposing team, and Adaptive Core
 * copying.
 *
 * @param options - Teams, augments, scaling and RNG.
 * @returns A {@link CombatState} ready for {@link stepCombat}.
 *
 * @example
 * const state = createCombat({
 *     player: [{ uid: 'p0', defId: 'chock', star: 1, row: 4, col: 3 }],
 *     enemy: [{ uid: 'e0', defId: 'pellet', star: 1, row: 3, col: 3 }],
 *     augments: [],
 *     enemyStatScale: 1,
 *     rng: Math.random,
 * });
 * while (state.phase === 'running') stepCombat(state, 1 / 30);
 */
export function createCombat(options: CombatOptions): CombatState {
    const units: CombatUnit[] = [];
    const defsOf = (placed: PlacedUnit[]) =>
        placed.map((p) => {
            const def = UNIT_BY_ID.get(p.defId);
            if (!def) throw new Error(`Unknown unit def: ${p.defId}`);
            return def;
        });
    const playerDefs = defsOf(options.player);
    const enemyDefs = defsOf(options.enemy);
    const zeroDayAgainst: Record<Team, boolean> = {
        // Penalty lands on the team OPPOSING the Zero-Day prime.
        player: hasPrime(enemyDefs, 'zero-day'),
        enemy: hasPrime(playerDefs, 'zero-day'),
    };
    const guardianUsed = { player: true, enemy: true };

    for (const team of ['player', 'enemy'] as Team[]) {
        const placed = team === 'player' ? options.player : options.enemy;
        const defs = team === 'player' ? playerDefs : enemyDefs;
        const augments = team === 'player' ? options.augments : [];
        const scale = team === 'player' ? 1 : options.enemyStatScale;
        const { modsFor, team: bonus } = computeTeamMods(defs, augments);
        guardianUsed[team] = !bonus.guardianRevive;

        placed.forEach((p, i) => {
            let def = defs[i];
            let abilityMult = 1;

            // Adaptive Core: become a copy of the strongest other ally.
            if (def.prime === 'adaptive-core') {
                const source = strongestCopySource(defs, i, placed);
                if (source) {
                    abilityMult = def.ability.power.base ?? 1;
                    def = source;
                }
            }

            const mods = modsFor(def);
            const items = itemsFor(p.items ?? []);
            const itemStats = aggregateItemStats(items);
            const original = defs[i];
            // Primes keep their own stat floor even when copying.
            const baseHp = Math.max(def.stats.hp, original.stats.hp);
            const baseAtk = Math.max(def.stats.atk, original.stats.atk);
            const maxHp =
                Math.round((starScale(baseHp, p.star) + bonus.hp) * scale) +
                itemStats.hp;
            const atk =
                Math.round((starScale(baseAtk, p.star) + bonus.atk) * scale) +
                itemStats.atk;
            const startMana = hasItemEffect(items, 'prechargedCapacitors')
                ? def.stats.manaMax
                : Math.min(
                      def.stats.manaMax - manaProfile(def).perAttack,
                      def.stats.manaStart +
                          bonus.startingMana +
                          itemStats.mana -
                          (zeroDayAgainst[team] ? ZERO_DAY_MANA_PENALTY : 0),
                  );
            units.push({
                uid: p.uid,
                def,
                team,
                star: p.star,
                row: p.row,
                col: p.col,
                alive: true,
                hp: maxHp,
                maxHp,
                shield: mods.startShieldFlat,
                mana: Math.max(0, startMana),
                manaMax: def.stats.manaMax,
                atk,
                ap: 1 + itemStats.ap,
                atkSpeed:
                    def.stats.atkSpeed *
                    (1 + bonus.atkSpeed + itemStats.atkSpeed),
                armor: def.stats.armor + bonus.armor + itemStats.armor,
                range: def.stats.range + mods.rangeBonus,
                mods,
                items,
                itemFx: createItemRuntime(),
                // Stagger first attacks slightly so rounds don't resolve in
                // perfect lockstep.
                attackCooldown: 0.3 + (units.length % 5) * 0.06,
                moveCooldown: 0,
                targetUid: null,
                attackCount: 0,
                hasMoved: false,
                turretStacks: 0,
                killStacks: 0,
                rampBonus: 0,
                rampTickIn: SURGE_RAMP_INTERVAL,
                atkSpeedKillStacks: 0,
                empoweredAttacks: 0,
                empowerFlat: 0,
                empowerPierce: false,
                cleaveRemaining: 0,
                cleaveFlat: 0,
                stunRemaining: 0,
                slowAmount: 0,
                slowRemaining: 0,
                markHeal: 0,
                markRemaining: 0,
                burnRate: 0,
                burnRemaining: 0,
                burnTickIn: 0,
                burnSource: null,
                discordAmount: 0,
                discordRemaining: 0,
                damageBuff: 0,
                damageBuffRemaining: 0,
                atkSpeedBuff: 0,
                atkSpeedBuffRemaining: 0,
                regenRate: 0,
                regenRemaining: 0,
                undyingRemaining: 0,
                silenceRemaining: 0,
                reformUsed: false,
                abilityMult,
                channel: null,
            });
        });
    }

    const state: CombatState = {
        units,
        byUid: new Map(units.map((u) => [u.uid, u])),
        time: 0,
        phase: 'running',
        events: [],
        pendingRevives: [],
        guardianUsed,
        spawnSeq: 0,
        rng: options.rng,
    };

    deployFlankers(state);
    // Announce start-of-combat barriers (Aegisline) so the render layer
    // plays the shield flash when the fight opens.
    for (const unit of units) {
        if (unit.shield > 0) {
            state.events.push({
                type: 'shield',
                unit: unit.uid,
                amount: unit.shield,
            });
        }
    }
    return state;
}

/** Picks the strongest non-token ally def for Adaptive Core to copy. */
function strongestCopySource(
    defs: UnitDef[],
    selfIndex: number,
    placed: PlacedUnit[],
): UnitDef | null {
    let best: UnitDef | null = null;
    let bestScore = -1;
    defs.forEach((def, i) => {
        if (i === selfIndex || def.token || def.prime === 'adaptive-core')
            return;
        const score =
            def.cost * 1_000_000 + placed[i].star * 10_000 + def.stats.hp;
        if (score > bestScore) {
            bestScore = score;
            best = def;
        }
    });
    return best;
}

/** Relocates Flanker-trait units into the opposing backline. */
function deployFlankers(state: CombatState): void {
    const occupied = occupiedCells(state);
    for (const unit of state.units) {
        if (!unit.mods.backlineSpawn) continue;
        // The opposing backline: rows 0-1 for player units, 6-7 for enemies.
        const rows =
            unit.team === 'player' ? [0, 1] : [BOARD_ROWS - 1, BOARD_ROWS - 2];
        let placedCell: { row: number; col: number } | null = null;
        for (const row of rows) {
            for (let d = 0; d < BOARD_COLS && !placedCell; d++) {
                for (const col of [unit.col - d, unit.col + d]) {
                    if (!inBounds(row, col)) continue;
                    if (occupied.has(cellKey(row, col))) continue;
                    placedCell = { row, col };
                    break;
                }
            }
            if (placedCell) break;
        }
        if (!placedCell) continue;
        occupied.delete(cellKey(unit.row, unit.col));
        occupied.add(cellKey(placedCell.row, placedCell.col));
        unit.row = placedCell.row;
        unit.col = placedCell.col;
    }
}

/** Alive units on a team. */
export function aliveUnits(state: CombatState, team: Team): CombatUnit[] {
    return state.units.filter((u) => u.alive && u.team === team);
}

/** Effective attacks-per-second including stacks, buffs and slows. */
export function effectiveAtkSpeed(unit: CombatUnit): number {
    const buff = unit.atkSpeedBuffRemaining > 0 ? unit.atkSpeedBuff : 0;
    const slow = unit.slowRemaining > 0 ? unit.slowAmount : 0;
    const itemBonus =
        unit.itemFx.overheatStacks * OVERHEAT_AS_PER_STACK +
        unit.itemFx.flywheelSpin +
        unit.itemFx.bunkerAtkSpeed;
    const factor = Math.max(
        MIN_SPEED_FACTOR,
        1 +
            unit.turretStacks +
            unit.mods.atkSpeedFlat +
            buff +
            unit.atkSpeedKillStacks +
            itemBonus -
            slow,
    );
    return unit.atkSpeed * factor;
}

/** Multiplier applied to all damage a unit deals right now. */
function outgoingMult(unit: CombatUnit): number {
    const buff = unit.damageBuffRemaining > 0 ? unit.damageBuff : 0;
    const barrier = unit.shield > 0 ? unit.mods.shieldedDamageBonus : 0;
    const flywheel = unit.itemFx.flywheelSpin;
    return (
        unit.mods.damageMult *
        (1 + unit.killStacks + buff + barrier + unit.rampBonus + flywheel)
    );
}

/**
 * Advances the combat sim by `dt` seconds. Emits render/audio events into
 * `state.events` (drain them after each step).
 *
 * @param state - Combat state (mutated).
 * @param dt - Fixed timestep in seconds.
 */
export function stepCombat(state: CombatState, dt: number): void {
    if (state.phase !== 'running') return;
    state.time += dt;

    processRevives(state);

    for (const unit of state.units) {
        if (!unit.alive) continue;
        tickUnit(state, unit, dt);
        if (state.phase !== 'running') return;
    }

    checkEnd(state);
}

function processRevives(state: CombatState): void {
    for (let i = state.pendingRevives.length - 1; i >= 0; i--) {
        const pending = state.pendingRevives[i];
        if (pending.at > state.time) continue;
        state.pendingRevives.splice(i, 1);
        const unit = state.byUid.get(pending.uid);
        if (!unit) continue;
        const occupied = occupiedCells(state);
        if (occupied.has(cellKey(unit.row, unit.col))) {
            const cell = nearestFreeCell(unit.row, unit.col, occupied);
            if (!cell) continue; // Board full; the frame stays down.
            unit.row = cell.row;
            unit.col = cell.col;
        }
        unit.alive = true;
        unit.hp = Math.max(1, Math.round(unit.maxHp * pending.hpPct));
        unit.shield = 0;
        unit.mana = 0;
        unit.targetUid = null;
        unit.attackCooldown = 0.5;
        unit.discordAmount = 0;
        unit.discordRemaining = 0;
        unit.silenceRemaining = 0;
        unit.burnRemaining = 0;
        unit.burnSource = null;
        unit.empoweredAttacks = 0;
        unit.empowerPierce = false;
        unit.cleaveRemaining = 0;
        unit.stunRemaining = 0;
        unit.slowRemaining = 0;
        unit.slowAmount = 0;
        unit.markRemaining = 0;
        unit.markHeal = 0;
        unit.channel = null;
        state.events.push({ type: 'revive', unit: unit.uid });
    }
}

function tickUnit(state: CombatState, unit: CombatUnit, dt: number): void {
    // Status decay.
    if (unit.discordRemaining > 0) unit.discordRemaining -= dt;
    if (unit.damageBuffRemaining > 0) unit.damageBuffRemaining -= dt;
    if (unit.atkSpeedBuffRemaining > 0) unit.atkSpeedBuffRemaining -= dt;
    if (hasItemEffect(unit.items, 'momentumFlywheel')) {
        unit.itemFx.flywheelSpin += FLYWHEEL_PER_SEC * dt;
    }
    if (unit.undyingRemaining > 0) unit.undyingRemaining -= dt;
    if (unit.silenceRemaining > 0) unit.silenceRemaining -= dt;
    if (unit.slowRemaining > 0) unit.slowRemaining -= dt;
    if (unit.markRemaining > 0) unit.markRemaining -= dt;
    if (unit.cleaveRemaining > 0) unit.cleaveRemaining -= dt;
    if (unit.regenRemaining > 0) {
        unit.regenRemaining -= dt;
        unit.hp = Math.min(unit.maxHp, unit.hp + unit.regenRate * dt);
    }

    // Juggernaut: passive self-repair.
    if (unit.mods.regenPctPerSec > 0) {
        unit.hp = Math.min(
            unit.maxHp,
            unit.hp + unit.maxHp * unit.mods.regenPctPerSec * dt,
        );
    }

    // Surgecore: reactors ramp damage the longer the fight runs.
    if (unit.mods.rampDamage > 0) {
        unit.rampTickIn -= dt;
        while (unit.rampTickIn <= 0) {
            unit.rampTickIn += SURGE_RAMP_INTERVAL;
            unit.rampBonus += unit.mods.rampDamage;
        }
    }

    // Burn DoT ticks in discrete chunks so damage numbers stay readable.
    if (unit.burnRemaining > 0) {
        unit.burnRemaining -= dt;
        unit.burnTickIn -= dt;
        while (unit.burnTickIn <= 0 && unit.alive) {
            unit.burnTickIn += BURN_TICK;
            applyDamage(
                state,
                unit.burnSource ?? unit,
                unit,
                unit.burnRate * BURN_TICK,
                0,
                false,
            );
        }
        if (!unit.alive) return;
    }

    // Turret frames dig in while they hold their starting hex.
    if (unit.mods.stationaryAtkSpeedPerSec > 0 && !unit.hasMoved) {
        unit.turretStacks = Math.min(
            TURRET_STACK_CAP,
            unit.turretStacks + unit.mods.stationaryAtkSpeedPerSec * dt,
        );
    }

    // Bunker Servos: dig in for armor and attack speed until first move.
    if (!unit.hasMoved && hasItemEffect(unit.items, 'bunkerServos')) {
        unit.armor += BUNKER_ARMOR_PER_SEC * dt;
        unit.itemFx.bunkerAtkSpeed += BUNKER_AS_PER_SEC * dt;
    }

    // Echo Processor: the armed echo fires even while stunned or moving.
    if (unit.itemFx.echoAt > 0 && state.time >= unit.itemFx.echoAt) {
        unit.itemFx.echoAt = 0;
        const echoTarget = acquireTarget(state, unit);
        if (echoTarget) {
            const mana = unit.mana;
            castAbility(state, unit, echoTarget, ECHO_POWER, true);
            unit.mana = mana;
        }
        if (!unit.alive || state.phase !== 'running') return;
    }

    // Stunned frames do nothing — no channel, no cast, no move, no attack.
    if (unit.stunRemaining > 0) {
        unit.stunRemaining -= dt;
        return;
    }

    if (unit.channel) {
        tickChannel(state, unit, dt);
        return;
    }

    unit.attackCooldown -= dt;
    unit.moveCooldown -= dt;

    const target = acquireTarget(state, unit);
    if (!target) return;

    // Cast as soon as mana is full (requires a live target, no silence).
    if (unit.mana >= unit.manaMax && unit.silenceRemaining <= 0) {
        castAbility(state, unit, target);
        return;
    }

    const dist = hexDistance(unit.row, unit.col, target.row, target.col);
    if (dist > unit.range) {
        if (!unit.mods.immobile && unit.moveCooldown <= 0) {
            moveStep(state, unit, target);
        }
        return;
    }

    if (unit.attackCooldown <= 0) {
        performAttack(state, unit, target);
        unit.attackCooldown = 1 / effectiveAtkSpeed(unit);
    }
}

function tickChannel(state: CombatState, unit: CombatUnit, dt: number): void {
    const channel = unit.channel!;
    channel.remaining -= dt;
    channel.tickIn -= dt;
    while (channel.tickIn <= 0 && channel.remaining > -channel.interval) {
        channel.tickIn += channel.interval;
        state.events.push({
            type: 'sweep',
            unit: unit.uid,
            col: channel.col,
        });
        for (const enemy of state.units) {
            if (
                !enemy.alive ||
                enemy.team === unit.team ||
                enemy.col !== channel.col
            ) {
                continue;
            }
            applyDamage(
                state,
                unit,
                enemy,
                channel.power,
                ABILITY_ARMOR_EFF,
                false,
            );
        }
        channel.col += channel.dir;
        if (channel.col >= BOARD_COLS || channel.col < 0) {
            channel.dir = -channel.dir as 1 | -1;
            channel.col += channel.dir * 2;
        }
    }
    if (channel.remaining <= 0) unit.channel = null;
}

function acquireTarget(
    state: CombatState,
    unit: CombatUnit,
): CombatUnit | null {
    const current = unit.targetUid
        ? state.byUid.get(unit.targetUid)
        : undefined;
    if (current && current.alive) return current;

    let best: CombatUnit | null = null;
    let bestDist = Infinity;
    for (const other of state.units) {
        if (!other.alive || other.team === unit.team) continue;
        const d = hexDistance(unit.row, unit.col, other.row, other.col);
        if (d < bestDist || (d === bestDist && best && other.uid < best.uid)) {
            bestDist = d;
            best = other;
        }
    }
    unit.targetUid = best ? best.uid : null;
    return best;
}

function occupiedCells(state: CombatState): Set<number> {
    const out = new Set<number>();
    for (const u of state.units) {
        if (u.alive) out.add(cellKey(u.row, u.col));
    }
    return out;
}

/** Breadth-first search for the closest unoccupied board cell. */
function nearestFreeCell(
    row: number,
    col: number,
    occupied: ReadonlySet<number>,
): { row: number; col: number } | null {
    for (let radius = 1; radius < BOARD_ROWS + BOARD_COLS; radius++) {
        for (const cell of cellsWithin(row, col, radius)) {
            if (!occupied.has(cellKey(cell.row, cell.col))) return cell;
        }
    }
    return null;
}

/** Marks a unit as having moved (breaks Turret stacks). */
function noteMoved(unit: CombatUnit): void {
    unit.hasMoved = true;
    unit.turretStacks = 0;
}

/** Teleports a unit to a cell, emitting a move event. */
function relocate(
    state: CombatState,
    unit: CombatUnit,
    row: number,
    col: number,
): void {
    unit.row = row;
    unit.col = col;
    noteMoved(unit);
    state.events.push({ type: 'move', unit: unit.uid, row, col });
}

function moveStep(
    state: CombatState,
    unit: CombatUnit,
    target: CombatUnit,
): void {
    const occupied = occupiedCells(state);
    const step = stepToward(
        { row: unit.row, col: unit.col },
        { row: target.row, col: target.col },
        occupied,
    );
    unit.moveCooldown = MOVE_INTERVAL;
    if (!step) return;
    unit.row = step.row;
    unit.col = step.col;
    noteMoved(unit);
    state.events.push({
        type: 'move',
        unit: unit.uid,
        row: step.row,
        col: step.col,
    });
}

function performAttack(
    state: CombatState,
    unit: CombatUnit,
    target: CombatUnit,
): void {
    state.events.push({
        type: 'attack',
        from: unit.uid,
        to: target.uid,
        ranged: unit.range > 1,
    });

    unit.mana = Math.min(
        unit.manaMax,
        unit.mana + manaProfile(unit.def).perAttack,
    );
    unit.attackCount++;

    // Blacksite: siphon mana from the target.
    if (unit.mods.manaSiphon > 0) {
        const stolen = Math.min(target.mana, unit.mods.manaSiphon);
        target.mana -= stolen;
        unit.mana = Math.min(unit.manaMax, unit.mana + stolen);
    }

    let raw = unit.atk * outgoingMult(unit);
    const isShell = unit.mods.bombardierBonus > 0 && unit.attackCount % 3 === 0;
    if (isShell) raw *= 1 + unit.mods.bombardierBonus;

    // Gatling Conversion: trade per-hit damage for the huge speed bonus.
    if (hasItemEffect(unit.items, 'gatling')) raw *= GATLING_DAMAGE_MULT;

    // Hybrid Actuator: spend one cast-charged attack.
    if (unit.itemFx.hybridAttacks > 0) {
        unit.itemFx.hybridAttacks--;
        raw += HYBRID_BONUS * unit.ap;
    }

    // Voltage Spike: burn target mana, converting each point into damage.
    if (hasItemEffect(unit.items, 'voltageSpike')) {
        const burned = Math.min(target.mana, VOLTAGE_MANA_BURN);
        target.mana -= burned;
        raw += burned * VOLTAGE_DMG_PER_MANA;
    }

    // Storm Gauntlet: flat bonus while electrified.
    const cleaving = unit.cleaveRemaining > 0;
    if (cleaving) raw += unit.cleaveFlat;

    // Overcharge: spend one empowered shot for flat bonus damage.
    const empowered = unit.empoweredAttacks > 0;
    if (empowered) {
        unit.empoweredAttacks--;
        raw += unit.empowerFlat;
    }

    const dealt = applyDamage(
        state,
        unit,
        target,
        raw,
        1,
        isShell || empowered,
    );

    // Vulture: attacks heal for a fraction of damage dealt.
    if (unit.mods.lifestealPct > 0 && dealt > 0) {
        healUnit(state, unit, unit, Math.round(dealt * unit.mods.lifestealPct));
    }

    // Breaker: shred armor off the target (Ablative Stack is immune).
    if (
        unit.mods.armorShredPerHit > 0 &&
        target.alive &&
        !hasItemEffect(target.items, 'ablativeStack')
    ) {
        target.armor = Math.max(0, target.armor - unit.mods.armorShredPerHit);
    }

    // Kinetic Ram: every 4th attack shoves and slows the target.
    if (
        target.alive &&
        unit.attackCount % KINETIC_EVERY === 0 &&
        hasItemEffect(unit.items, 'kineticRam')
    ) {
        knockback(state, unit, target);
        applySlow(target, KINETIC_SLOW, KINETIC_SLOW_DURATION);
    }

    // Overheat Driver: build heat; at the cap, vent it onto everyone nearby.
    if (hasItemEffect(unit.items, 'overheat')) {
        unit.itemFx.overheatStacks++;
        if (unit.itemFx.overheatStacks >= OVERHEAT_STACK_CAP) {
            unit.itemFx.overheatStacks = 0;
            for (const enemy of enemies(state, unit)) {
                if (
                    hexDistance(unit.row, unit.col, enemy.row, enemy.col) === 1
                ) {
                    applyBurn(enemy, unit, OVERHEAT_BURN_RATE * unit.ap);
                }
            }
            dealTo(
                state,
                unit,
                unit,
                Math.round(unit.maxHp * OVERHEAT_SELF_HP_FRAC),
                false,
            );
        }
    }

    // Induction Coil: attacks trickle mana to adjacent allies.
    if (hasItemEffect(unit.items, 'inductionCoil')) {
        for (const ally of allies(state, unit, false)) {
            if (hexDistance(unit.row, unit.col, ally.row, ally.col) === 1) {
                ally.mana = Math.min(ally.manaMax, ally.mana + INDUCTION_MANA);
            }
        }
    }

    // Death Omen: striking a marked target heals the attacker.
    if (target.markRemaining > 0 && target.markHeal > 0) {
        healUnit(state, unit, unit, target.markHeal);
    }

    // Overcharge / Railgun Chassis pierce: the round continues one hex
    // behind the target.
    if (
        (empowered && unit.empowerPierce) ||
        hasItemEffect(unit.items, 'railgun')
    ) {
        const behind = cellBehind(unit, target);
        const victim = state.units.find(
            (u) =>
                u.alive &&
                u.team !== unit.team &&
                u.row === behind.row &&
                u.col === behind.col,
        );
        if (victim) applyDamage(state, unit, victim, raw, 1, false);
    }

    // Storm Gauntlet: cleave a second adjacent enemy.
    if (cleaving) {
        const second = enemies(state, unit).find(
            (e) =>
                e !== target &&
                hexDistance(unit.row, unit.col, e.row, e.col) === 1,
        );
        if (second) {
            applyDamage(state, unit, second, raw * CLEAVE_FRACTION, 1, false);
        }
    }

    // Splash: Bombardier shells hit adjacent hexes at full power; splash
    // manufacturers (Blastworks) and Emplacement use their fraction.
    const splash = isShell ? 1 : unit.mods.splashPct;
    if (splash > 0) {
        const cells = new Set(
            neighbors(target.row, target.col).map((c) => cellKey(c.row, c.col)),
        );
        for (const other of state.units) {
            if (!other.alive || other.team === unit.team || other === target) {
                continue;
            }
            if (cells.has(cellKey(other.row, other.col))) {
                applyDamage(state, unit, other, raw * splash, 1, false);
            }
        }
    }

    // Amplifier / Iris: Discord the target.
    if (unit.mods.discordOnHit > 0 && target.alive) {
        applyDiscord(
            target,
            unit.mods.discordOnHit,
            unit.mods.discordPermanent ? Infinity : DISCORD_DURATION,
        );
    }
}

/** Pushes a unit one hex directly away from an anchor, if a cell is free. */
function knockback(
    state: CombatState,
    from: CombatUnit,
    unit: CombatUnit,
): void {
    const occupied = occupiedCells(state);
    let best: { row: number; col: number } | null = null;
    let bestDist = hexDistance(from.row, from.col, unit.row, unit.col);
    for (const cell of neighbors(unit.row, unit.col)) {
        if (occupied.has(cellKey(cell.row, cell.col))) continue;
        const d = hexDistance(from.row, from.col, cell.row, cell.col);
        if (d > bestDist) {
            bestDist = d;
            best = cell;
        }
    }
    if (best) relocate(state, unit, best.row, best.col);
}

/** Applies a burn DoT, keeping the strongest active burn. */
function applyBurn(target: CombatUnit, source: CombatUnit, rate: number): void {
    if (rate >= target.burnRate) {
        target.burnRate = rate;
        target.burnSource = source;
    }
    target.burnRemaining = Math.max(target.burnRemaining, BURN_DURATION);
    if (target.burnTickIn <= 0) target.burnTickIn = BURN_TICK;
}

function applyDiscord(
    target: CombatUnit,
    amount: number,
    duration: number,
): void {
    if (amount >= target.discordAmount) {
        target.discordAmount = amount;
        target.discordRemaining = Math.max(target.discordRemaining, duration);
    }
}

/**
 * Applies mitigated damage to a target, handling Discord amplification,
 * Bulwark interception, shields, mana-on-damage, undying floors and death.
 *
 * @returns The damage actually dealt to the primary target.
 */
function applyDamage(
    state: CombatState,
    source: CombatUnit,
    target: CombatUnit,
    raw: number,
    armorEff: number,
    crit: boolean,
): number {
    if (target.discordRemaining > 0) raw *= 1 + target.discordAmount;
    raw *= 1 - target.mods.damageReduction;

    // Reaper: bonus damage to targets already below half HP.
    if (source.mods.executeDamageBonus > 0 && target.hp < target.maxHp * 0.5) {
        raw *= 1 + source.mods.executeDamageBonus;
    }

    const armor = Math.max(0, target.armor * armorEff);
    let amount = Math.max(1, Math.round(raw * (100 / (100 + armor))));

    // Bulwark: an adjacent bulwark shoulders part of the hit. Bulwarks do
    // not intercept for each other.
    if (target.mods.interceptPct === 0) {
        const bulwark = adjacentBulwark(state, target);
        if (bulwark) {
            const redirected = Math.round(amount * bulwark.mods.interceptPct);
            if (redirected > 0) {
                amount -= redirected;
                dealTo(state, source, bulwark, redirected, false);
            }
        }
    }

    dealTo(state, source, target, amount, crit);
    return amount;
}

function adjacentBulwark(
    state: CombatState,
    target: CombatUnit,
): CombatUnit | null {
    for (const other of state.units) {
        if (
            !other.alive ||
            other.team !== target.team ||
            other === target ||
            other.mods.interceptPct === 0
        ) {
            continue;
        }
        if (hexDistance(target.row, target.col, other.row, other.col) === 1) {
            return other;
        }
    }
    return null;
}

/** Applies a final damage amount to a unit (shields, HP, death). */
function dealTo(
    state: CombatState,
    source: CombatUnit,
    target: CombatUnit,
    amount: number,
    crit: boolean,
): void {
    let remaining = amount;
    if (target.shield > 0) {
        // Firewall Matrix: enemies striking the shield are Discorded.
        if (
            source.team !== target.team &&
            hasItemEffect(target.items, 'firewallMatrix')
        ) {
            applyDiscord(source, FIREWALL_DISCORD, FIREWALL_DISCORD_DURATION);
        }
        const absorbed = Math.min(target.shield, remaining);
        target.shield -= absorbed;
        remaining -= absorbed;
    }
    target.hp -= remaining;
    if (target.undyingRemaining > 0 && target.hp < 1) target.hp = 1;
    const mana = manaProfile(target.def);
    // Coolant Reservoir: mana from damage is uncapped and boosted.
    const manaGain = hasItemEffect(target.items, 'coolantReservoir')
        ? amount * mana.perDamage * COOLANT_MANA_MULT
        : Math.min(mana.perHitCap, amount * mana.perDamage);
    target.mana = Math.min(target.manaMax, target.mana + manaGain);
    state.events.push({
        type: 'hit',
        target: target.uid,
        amount,
        crit,
        source: source.uid,
    });

    if (target.alive && target.hp > 0 && source !== target) {
        // Ablative Stack: plating hardens with every hit absorbed.
        if (
            target.itemFx.ablativeGained < ABLATIVE_ARMOR_CAP &&
            hasItemEffect(target.items, 'ablativeStack')
        ) {
            const gain = Math.min(
                ABLATIVE_ARMOR_PER_HIT,
                ABLATIVE_ARMOR_CAP - target.itemFx.ablativeGained,
            );
            target.armor += gain;
            target.itemFx.ablativeGained += gain;
        }
        // Emergency Bulkhead: one panic slam when the hull is half gone.
        if (
            target.hp < target.maxHp * BULKHEAD_HP_THRESHOLD &&
            !target.itemFx.bulkheadUsed &&
            hasItemEffect(target.items, 'emergencyBulkhead')
        ) {
            target.itemFx.bulkheadUsed = true;
            clearDebuffs(target);
            shieldUnit(
                state,
                target,
                Math.round(target.maxHp * BULKHEAD_SHIELD_FRAC),
            );
            for (const enemy of enemies(state, target)) {
                if (
                    hexDistance(
                        target.row,
                        target.col,
                        enemy.row,
                        enemy.col,
                    ) === 1
                ) {
                    knockback(state, target, enemy);
                }
            }
        }
    }

    if (target.hp <= 0) {
        target.hp = 0;
        target.alive = false;
        target.targetUid = null;
        target.channel = null;
        state.events.push({ type: 'death', unit: target.uid });
        if (source.mods.damagePerKill > 0) {
            source.killStacks += source.mods.damagePerKill;
        }
        if (source.mods.atkSpeedPerKill > 0) {
            source.atkSpeedKillStacks += source.mods.atkSpeedPerKill;
        }
        // Salvage Claws: strip the kill for parts.
        if (source !== target && hasItemEffect(source.items, 'salvageClaws')) {
            source.atk += SALVAGE_ATK;
            healUnit(
                state,
                source,
                source,
                Math.round(source.maxHp * SALVAGE_HEAL_FRAC),
            );
        }
        // Foundry Core: the wreck reassembles into a sentry.
        if (hasItemEffect(target.items, 'foundryCore')) {
            summonSentry(
                state,
                target,
                Math.round(target.maxHp * FOUNDRY_HP_FRAC),
            );
        }
        scheduleRevive(state, target);
    }
}

/** Strips every debuff from a unit (cleanse, Emergency Bulkhead). */
function clearDebuffs(unit: CombatUnit): void {
    unit.discordAmount = 0;
    unit.discordRemaining = 0;
    unit.silenceRemaining = 0;
    unit.stunRemaining = 0;
    unit.slowRemaining = 0;
    unit.slowAmount = 0;
    unit.markRemaining = 0;
    unit.markHeal = 0;
    unit.burnRemaining = 0;
    unit.burnRate = 0;
}

/** Queues Hardlight re-forms and Guardian Protocol rebuilds on death. */
function scheduleRevive(state: CombatState, unit: CombatUnit): void {
    if (unit.def.token) return;
    if (unit.mods.reformPct > 0 && !unit.reformUsed) {
        unit.reformUsed = true;
        state.pendingRevives.push({
            uid: unit.uid,
            at: state.time + REFORM_DELAY,
            hpPct: unit.mods.reformPct,
        });
        return;
    }
    if (!state.guardianUsed[unit.team]) {
        state.guardianUsed[unit.team] = true;
        state.pendingRevives.push({
            uid: unit.uid,
            at: state.time + GUARDIAN_REVIVE_DELAY,
            hpPct: GUARDIAN_REVIVE_PCT,
        });
    }
}

/**
 * Heals a target, applying the source's Medic bonuses. Overheal becomes
 * shield when the source has `overhealShield`.
 */
function healUnit(
    state: CombatState,
    source: CombatUnit,
    target: CombatUnit,
    amount: number,
): void {
    const boosted = Math.round(amount * (1 + source.mods.healBoost));
    const healed = Math.min(boosted, target.maxHp - target.hp);
    target.hp += healed;
    if (healed > 0) {
        state.events.push({ type: 'heal', unit: target.uid, amount: healed });
    }
    const overflow = boosted - healed;
    if (overflow > 0 && source.mods.overhealShield) {
        shieldUnit(state, target, overflow);
    }
}

function shieldUnit(
    state: CombatState,
    unit: CombatUnit,
    amount: number,
): void {
    unit.shield += amount;
    state.events.push({ type: 'shield', unit: unit.uid, amount });
}

/** Alive allies of a unit (including itself unless excluded). */
function allies(
    state: CombatState,
    unit: CombatUnit,
    includeSelf: boolean,
): CombatUnit[] {
    return state.units.filter(
        (u) => u.alive && u.team === unit.team && (includeSelf || u !== unit),
    );
}

function enemies(state: CombatState, unit: CombatUnit): CombatUnit[] {
    return state.units.filter((u) => u.alive && u.team !== unit.team);
}

/** The `count` allies with the lowest HP fraction. */
function lowestAllies(
    state: CombatState,
    unit: CombatUnit,
    count: number,
): CombatUnit[] {
    return allies(state, unit, true)
        .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)
        .slice(0, count);
}

function farthestEnemy(
    state: CombatState,
    unit: CombatUnit,
): CombatUnit | null {
    let best: CombatUnit | null = null;
    let bestDist = -1;
    for (const enemy of enemies(state, unit)) {
        const d = hexDistance(unit.row, unit.col, enemy.row, enemy.col);
        if (d > bestDist) {
            bestDist = d;
            best = enemy;
        }
    }
    return best;
}

/** The living enemy nearest to an anchor cell, optionally excluding one. */
function nearestEnemyTo(
    state: CombatState,
    unit: CombatUnit,
    anchor: { row: number; col: number },
    exclude: CombatUnit | null,
): CombatUnit | null {
    let best: CombatUnit | null = null;
    let bestDist = Infinity;
    for (const enemy of enemies(state, unit)) {
        if (enemy === exclude) continue;
        const d = hexDistance(anchor.row, anchor.col, enemy.row, enemy.col);
        if (d < bestDist) {
            bestDist = d;
            best = enemy;
        }
    }
    return best;
}

/** Applies an attack-speed slow, keeping the strongest active amount. */
function applySlow(target: CombatUnit, amount: number, duration: number): void {
    if (groundingBlock(target)) return;
    target.slowAmount = Math.max(target.slowAmount, amount);
    target.slowRemaining = Math.max(target.slowRemaining, duration);
}

/** Applies a stun, keeping the longest remaining duration. */
function applyStun(target: CombatUnit, duration: number): void {
    if (groundingBlock(target)) return;
    target.stunRemaining = Math.max(target.stunRemaining, duration);
}

/** Grounding Rods: blocks the incoming stun/slow and pays out mana. */
function groundingBlock(target: CombatUnit): boolean {
    if (!hasItemEffect(target.items, 'groundingRods')) return false;
    target.mana = Math.min(target.manaMax, target.mana + GROUNDING_MANA);
    return true;
}

/** The cell one hex beyond `to`, continuing the from→to ray. */
function cellBehind(
    from: { row: number; col: number },
    to: { row: number; col: number },
): { row: number; col: number } {
    const [ax, az] = axial(from.row, from.col);
    const [bx, bz] = axial(to.row, to.col);
    const dist = Math.max(1, hexDistance(from.row, from.col, to.row, to.col));
    const t = (dist + 1) / dist;
    return axialRound(ax + (bx - ax) * t, az + (bz - az) * t);
}

/** A free cell adjacent to an anchor, or null when fully enclosed. */
function freeNeighbor(
    state: CombatState,
    row: number,
    col: number,
): { row: number; col: number } | null {
    const occupied = occupiedCells(state);
    for (const cell of neighbors(row, col)) {
        if (!occupied.has(cellKey(cell.row, cell.col))) return cell;
    }
    return null;
}

function castAbility(
    state: CombatState,
    unit: CombatUnit,
    target: CombatUnit,
    powerMult = 1,
    isEcho = false,
): void {
    const ability = unit.def.ability;
    unit.mana = 0;
    state.events.push({
        type: 'cast',
        unit: unit.uid,
        ability: ability.name,
        kind: ability.kind,
    });

    // Echo Processor recasts skip on-cast item hooks so the echo cannot
    // re-arm itself or double-stack per-cast item bonuses.
    if (!isEcho) {
        if (hasItemEffect(unit.items, 'predictiveTargeting')) {
            unit.atkSpeedBuff = Math.max(unit.atkSpeedBuff, PREDICTIVE_AS);
            unit.atkSpeedBuffRemaining = Math.max(
                unit.atkSpeedBuffRemaining,
                PREDICTIVE_DURATION,
            );
        }
        if (hasItemEffect(unit.items, 'hybridActuator')) {
            unit.itemFx.hybridAttacks = HYBRID_ATTACKS;
        }
        if (hasItemEffect(unit.items, 'firewallMatrix')) {
            shieldUnit(state, unit, Math.round(FIREWALL_SHIELD * unit.ap));
        }
        if (hasItemEffect(unit.items, 'repairSubroutine')) {
            healUnit(state, unit, unit, Math.round(REPAIR_HEAL * unit.ap));
        }
        if (hasItemEffect(unit.items, 'overclockKernel')) {
            unit.ap += KERNEL_AP_PER_CAST;
        }
        if (hasItemEffect(unit.items, 'coolantReservoir')) {
            healUnit(
                state,
                unit,
                unit,
                Math.round(unit.maxHp * COOLANT_HEAL_FRAC),
            );
        }
        if (
            hasItemEffect(unit.items, 'prechargedCapacitors') &&
            !unit.itemFx.firstCastDone
        ) {
            unit.itemFx.firstCastDone = true;
            unit.manaMax = Math.round(unit.manaMax * (1 - PRECHARGED_DISCOUNT));
        }
        if (
            hasItemEffect(unit.items, 'echoProcessor') &&
            !unit.itemFx.echoUsed
        ) {
            unit.itemFx.echoUsed = true;
            unit.itemFx.echoAt = state.time + ECHO_DELAY;
        }
    }

    const mult = unit.abilityMult * outgoingMult(unit) * powerMult;
    const resolve = (scaling: Scaling | undefined) =>
        scaling ? resolveScaling(unit, scaling) : 0;
    const power = resolve(ability.power) * mult;
    const dmg = (victim: CombatUnit, amount: number) =>
        applyDamage(state, unit, victim, amount, ABILITY_ARMOR_EFF, false);

    switch (ability.kind) {
        case 'strike': {
            dmg(target, power);
            break;
        }
        case 'nova': {
            const radius = ability.aux ?? 1;
            let total = 0;
            for (const enemy of enemies(state, unit)) {
                if (
                    hexDistance(unit.row, unit.col, enemy.row, enemy.col) <=
                    radius
                ) {
                    total += dmg(enemy, power);
                }
            }
            const healFrac = ability.aux2 ?? 0;
            if (healFrac > 0 && total > 0) {
                healUnit(state, unit, unit, Math.round(total * healFrac));
            }
            break;
        }
        case 'ram': {
            const cells = lineThrough(unit, target);
            const victims = enemies(state, unit).filter((e) =>
                cells.has(cellKey(e.row, e.col)),
            );
            const stun = ability.aux2 ?? 0;
            for (const enemy of victims) {
                dmg(enemy, power);
                if (enemy.alive) {
                    knockback(state, unit, enemy);
                    if (stun > 0) applyStun(enemy, stun);
                }
            }
            break;
        }
        case 'bastion': {
            dmg(target, power);
            shieldUnit(state, unit, Math.round(resolve(ability.secondary)));
            break;
        }
        case 'blast': {
            const radius = ability.aux ?? 1;
            const manaBurn = ability.aux2 ?? 0;
            for (const enemy of enemies(state, unit)) {
                if (
                    hexDistance(target.row, target.col, enemy.row, enemy.col) <=
                        radius ||
                    enemy === target
                ) {
                    dmg(enemy, power);
                    if (manaBurn > 0 && enemy.alive) {
                        enemy.mana = Math.max(0, enemy.mana - manaBurn);
                    }
                }
            }
            break;
        }
        case 'bounce': {
            const blastAt = (center: CombatUnit, amount: number) => {
                for (const enemy of enemies(state, unit)) {
                    if (
                        enemy === center ||
                        hexDistance(
                            center.row,
                            center.col,
                            enemy.row,
                            enemy.col,
                        ) <= 1
                    ) {
                        dmg(enemy, amount);
                    }
                }
            };
            blastAt(target, power);
            const pool = enemies(state, unit).filter((e) => e !== target);
            if (pool.length > 0) {
                const second = pool[Math.floor(state.rng() * pool.length)];
                blastAt(second, power * (ability.aux ?? 0.5));
            }
            break;
        }
        case 'triage': {
            const wounded = lowestAllies(state, unit, 1)[0];
            if (!wounded) break;
            healUnit(state, unit, wounded, power);
            const splash = Math.round(resolve(ability.secondary));
            if (splash > 0) {
                for (const ally of allies(state, unit, true)) {
                    if (
                        ally !== wounded &&
                        hexDistance(
                            wounded.row,
                            wounded.col,
                            ally.row,
                            ally.col,
                        ) === 1
                    ) {
                        healUnit(state, unit, ally, splash);
                    }
                }
            }
            break;
        }
        case 'echo': {
            const discord = ability.aux ?? 0.15;
            dmg(target, power);
            if (target.alive) applyDiscord(target, discord, DISCORD_DURATION);
            const second = nearestEnemyTo(state, unit, target, target);
            if (second) {
                dmg(second, power);
                if (second.alive) {
                    applyDiscord(second, discord, DISCORD_DURATION);
                }
            }
            break;
        }
        case 'summon': {
            summonSentry(state, unit, power);
            break;
        }
        case 'flicker': {
            let victim: CombatUnit | null = target;
            for (let i = 0; i < RECAST_CAP && victim; i++) {
                const cell = freeNeighbor(state, victim.row, victim.col);
                if (cell) relocate(state, unit, cell.row, cell.col);
                dmg(victim, power);
                if (victim.alive) break;
                victim = nearestEnemyTo(state, unit, unit, null);
            }
            break;
        }
        case 'phantom': {
            const cell = freeNeighbor(state, target.row, target.col);
            if (cell) relocate(state, unit, cell.row, cell.col);
            dmg(target, power);
            if (!target.alive) {
                unit.mana = Math.round(unit.manaMax * (ability.aux ?? 0.8));
            }
            break;
        }
        case 'drain': {
            dmg(target, power);
            const wounded = lowestAllies(state, unit, 1)[0];
            if (wounded) {
                healUnit(
                    state,
                    unit,
                    wounded,
                    Math.round(resolve(ability.secondary) * mult),
                );
            }
            break;
        }
        case 'concussive': {
            const shells = ability.aux ?? 3;
            const slowAmt = ability.aux2 ?? 0.3;
            for (let i = 0; i < shells; i++) {
                const pool = enemies(state, unit);
                if (pool.length === 0) break;
                const victim = pool[Math.floor(state.rng() * pool.length)];
                dmg(victim, power);
                applySlow(victim, slowAmt, CONCUSSIVE_SLOW_DURATION);
                for (const other of enemies(state, unit)) {
                    if (
                        other !== victim &&
                        hexDistance(
                            victim.row,
                            victim.col,
                            other.row,
                            other.col,
                        ) === 1
                    ) {
                        dmg(other, power * SHELL_SPLASH);
                        applySlow(other, slowAmt, CONCUSSIVE_SLOW_DURATION);
                    }
                }
            }
            break;
        }
        case 'barrage': {
            const missiles = ability.aux ?? 5;
            for (let i = 0; i < missiles; i++) {
                const pool = enemies(state, unit);
                if (pool.length === 0) break;
                const victim = pool[Math.floor(state.rng() * pool.length)];
                const hit = i === missiles - 1 ? power * 2 : power;
                dmg(victim, hit);
                for (const other of enemies(state, unit)) {
                    if (
                        other !== victim &&
                        hexDistance(
                            victim.row,
                            victim.col,
                            other.row,
                            other.col,
                        ) === 1
                    ) {
                        dmg(other, hit * SHELL_SPLASH);
                    }
                }
            }
            break;
        }
        case 'sweep': {
            const duration = ability.aux ?? 4;
            const channel: SweepChannel = {
                remaining: duration,
                interval: duration / (BOARD_COLS * 2),
                tickIn: 0,
                col: 0,
                dir: 1,
                power,
            };
            unit.channel = channel;
            break;
        }
        case 'snipe': {
            const far = farthestEnemy(state, unit);
            if (!far) break;
            const d = hexDistance(unit.row, unit.col, far.row, far.col);
            const cells = lineThrough(unit, far);
            for (const enemy of enemies(state, unit)) {
                if (enemy === far) {
                    dmg(enemy, power * (1 + SNIPE_PER_HEX * d));
                } else if (cells.has(cellKey(enemy.row, enemy.col))) {
                    dmg(enemy, power);
                }
            }
            break;
        }
        case 'aura': {
            const duration = ability.power.base ?? 0;
            const bonus = (ability.aux ?? 0.25) * unit.ap;
            const enemySlow = ability.aux2 ?? 0;
            for (const ally of allies(state, unit, true)) {
                if (
                    hexDistance(unit.row, unit.col, ally.row, ally.col) <=
                    AURA_RADIUS
                ) {
                    ally.atkSpeedBuff = Math.max(ally.atkSpeedBuff, bonus);
                    ally.atkSpeedBuffRemaining = duration;
                }
            }
            if (enemySlow > 0) {
                for (const enemy of enemies(state, unit)) {
                    if (
                        hexDistance(unit.row, unit.col, enemy.row, enemy.col) <=
                        AURA_RADIUS
                    ) {
                        applySlow(enemy, enemySlow, duration);
                    }
                }
            }
            break;
        }
        case 'hook': {
            const far = farthestEnemy(state, unit);
            if (!far) break;
            const cell = freeNeighbor(state, unit.row, unit.col);
            if (cell) relocate(state, far, cell.row, cell.col);
            dmg(far, power);
            break;
        }
        case 'cleanse': {
            for (const ally of lowestAllies(state, unit, ability.aux ?? 2)) {
                clearDebuffs(ally);
                healUnit(state, unit, ally, power);
            }
            break;
        }
        case 'reap': {
            const threshold = Math.min(0.4, (ability.aux ?? 0.2) * unit.ap);
            for (const enemy of enemies(state, unit)) {
                if (hexDistance(unit.row, unit.col, enemy.row, enemy.col) > 1) {
                    continue;
                }
                dmg(enemy, power);
                if (enemy.alive && enemy.hp / enemy.maxHp < threshold) {
                    // Execute: the remainder bypasses armor and shields.
                    dealTo(state, unit, enemy, enemy.hp + enemy.shield, true);
                }
            }
            break;
        }
        case 'overcharge': {
            unit.empoweredAttacks = ability.aux ?? 4;
            unit.empowerFlat = power;
            unit.empowerPierce = (ability.aux2 ?? 0) > 0;
            break;
        }
        case 'scorch': {
            const radius = ability.aux ?? 1;
            for (const enemy of enemies(state, unit)) {
                if (
                    hexDistance(unit.row, unit.col, enemy.row, enemy.col) <=
                    radius
                ) {
                    dmg(enemy, power);
                    if (enemy.alive) {
                        applyBurn(
                            enemy,
                            unit,
                            resolve(ability.secondary) * mult,
                        );
                    }
                }
            }
            break;
        }
        case 'rally': {
            for (const ally of lowestAllies(state, unit, ability.aux ?? 3)) {
                healUnit(state, unit, ally, power);
                ally.atkSpeedBuff = Math.max(
                    ally.atkSpeedBuff,
                    RALLY_ATK_SPEED,
                );
                ally.atkSpeedBuffRemaining = Math.max(
                    ally.atkSpeedBuffRemaining,
                    RALLY_DURATION,
                );
            }
            break;
        }
        case 'empower': {
            const pool = allies(state, unit, false);
            const strong = pool.sort((a, b) => b.atk - a.atk)[0] ?? unit;
            healUnit(state, unit, strong, power);
            strong.damageBuff = Math.max(strong.damageBuff, ability.aux ?? 0.3);
            strong.damageBuffRemaining = EMPOWER_DURATION;
            break;
        }
        case 'well': {
            const radius = ability.aux ?? 2;
            const caught = enemies(state, unit)
                .filter(
                    (e) =>
                        hexDistance(unit.row, unit.col, e.row, e.col) <= radius,
                )
                .sort(
                    (a, b) =>
                        hexDistance(unit.row, unit.col, a.row, a.col) -
                        hexDistance(unit.row, unit.col, b.row, b.col),
                );
            for (const enemy of caught) {
                const cell = freeNeighbor(state, unit.row, unit.col);
                if (
                    cell &&
                    hexDistance(unit.row, unit.col, enemy.row, enemy.col) > 1
                ) {
                    relocate(state, enemy, cell.row, cell.col);
                }
                dmg(enemy, power);
            }
            break;
        }
        case 'valkyrie': {
            const bonus = ability.aux ?? 0.3;
            for (const ally of allies(state, unit, true)) {
                healUnit(state, unit, ally, power);
                ally.damageBuff = Math.max(ally.damageBuff, bonus);
                ally.damageBuffRemaining = VALKYRIE_DURATION;
            }
            break;
        }
        case 'transcend': {
            const duration = ability.aux ?? 3;
            const regen = resolveScaling(unit, ability.power);
            for (const ally of allies(state, unit, true)) {
                ally.undyingRemaining = Math.max(
                    ally.undyingRemaining,
                    duration,
                );
                ally.regenRate = Math.max(ally.regenRate, regen);
                ally.regenRemaining = Math.max(ally.regenRemaining, duration);
            }
            break;
        }
        case 'emp': {
            const silence = ability.aux ?? 4;
            const frac = Math.min(0.35, (ability.power.base ?? 0) * unit.ap);
            for (const enemy of enemies(state, unit)) {
                enemy.mana = 0;
                enemy.silenceRemaining = Math.max(
                    enemy.silenceRemaining,
                    silence,
                );
                // %-current-HP true damage: bypass armor entirely.
                applyDamage(state, unit, enemy, enemy.hp * frac, 0, false);
            }
            break;
        }
        case 'chain': {
            dmg(target, power);
            const arc = resolve(ability.secondary) * mult;
            const second = nearestEnemyTo(state, unit, target, target);
            if (second && arc > 0) dmg(second, arc);
            break;
        }
        case 'feast': {
            dmg(target, power);
            if (!target.alive) unit.killStacks += ability.aux ?? 0.2;
            break;
        }
        case 'fortify': {
            unit.armor += Math.round(resolveScaling(unit, ability.power));
            for (const enemy of enemies(state, unit)) {
                if (
                    hexDistance(unit.row, unit.col, enemy.row, enemy.col) === 1
                ) {
                    knockback(state, unit, enemy);
                }
            }
            break;
        }
        case 'shockwave': {
            for (const enemy of enemies(state, unit)) {
                if (
                    hexDistance(unit.row, unit.col, enemy.row, enemy.col) <= 1
                ) {
                    dmg(enemy, power);
                }
            }
            break;
        }
        case 'mark': {
            const victim = enemies(state, unit).sort(
                (a, b) => b.atk - a.atk,
            )[0];
            if (!victim) break;
            const duration = ability.power.base ?? 0;
            applyDiscord(victim, ability.aux ?? 0.2, duration);
            victim.markHeal = Math.round(resolve(ability.secondary));
            victim.markRemaining = duration;
            break;
        }
        case 'phalanx': {
            shieldUnit(state, unit, Math.round(power));
            for (const ally of allies(state, unit, false)) {
                if (hexDistance(unit.row, unit.col, ally.row, ally.col) === 1) {
                    shieldUnit(state, ally, Math.round(power));
                }
            }
            break;
        }
        case 'devour': {
            const dealt = dmg(target, power);
            healUnit(state, unit, unit, Math.round(dealt * (ability.aux ?? 1)));
            if (!target.alive) {
                const gain = Math.round(resolve(ability.secondary));
                unit.maxHp += gain;
                unit.hp = Math.min(unit.maxHp, unit.hp + gain);
            }
            break;
        }
        case 'gauntlet': {
            unit.cleaveRemaining = ability.aux ?? 4;
            unit.cleaveFlat = power;
            break;
        }
        case 'guillotine': {
            const recasts = ability.aux ?? 2;
            for (let i = 0; i <= Math.min(recasts, RECAST_CAP); i++) {
                const victim = enemies(state, unit).sort(
                    (a, b) => a.hp - b.hp,
                )[0];
                if (!victim) break;
                dmg(victim, power);
                if (victim.alive) break;
            }
            break;
        }
        case 'rush': {
            const far = farthestEnemy(state, unit);
            if (!far) break;
            const cells = lineThrough(unit, far);
            const victims = enemies(state, unit).filter((e) =>
                cells.has(cellKey(e.row, e.col)),
            );
            const cell = freeNeighbor(state, far.row, far.col);
            if (cell) relocate(state, unit, cell.row, cell.col);
            for (const enemy of victims) dmg(enemy, power);
            break;
        }
        case 'mimic': {
            // Only reachable when Adaptive Core found nothing to copy —
            // fall back to a heavy strike.
            dmg(target, unit.atk * 2 * unit.abilityMult);
            break;
        }
    }
}

/** Spawns a Sentry token adjacent to the caster. */
function summonSentry(
    state: CombatState,
    caster: CombatUnit,
    hp: number,
): void {
    const def = UNIT_BY_ID.get('sentry');
    if (!def) return;
    const cell = freeNeighbor(state, caster.row, caster.col);
    if (!cell) return;
    const maxHp = Math.max(1, Math.round(hp));
    const unit: CombatUnit = {
        uid: `summon-${state.spawnSeq++}`,
        def,
        team: caster.team,
        star: caster.star,
        row: cell.row,
        col: cell.col,
        alive: true,
        hp: maxHp,
        maxHp,
        shield: 0,
        mana: 0,
        manaMax: def.stats.manaMax,
        atk: starScale(def.stats.atk, caster.star),
        ap: 1,
        atkSpeed: def.stats.atkSpeed,
        armor: def.stats.armor,
        range: def.stats.range,
        mods: { ...baseMods(), immobile: true },
        items: [],
        itemFx: createItemRuntime(),
        attackCooldown: 0.2,
        moveCooldown: 0,
        targetUid: null,
        attackCount: 0,
        hasMoved: false,
        turretStacks: 0,
        killStacks: 0,
        rampBonus: 0,
        rampTickIn: SURGE_RAMP_INTERVAL,
        atkSpeedKillStacks: 0,
        empoweredAttacks: 0,
        empowerFlat: 0,
        empowerPierce: false,
        cleaveRemaining: 0,
        cleaveFlat: 0,
        stunRemaining: 0,
        slowAmount: 0,
        slowRemaining: 0,
        markHeal: 0,
        markRemaining: 0,
        burnRate: 0,
        burnRemaining: 0,
        burnTickIn: 0,
        burnSource: null,
        discordAmount: 0,
        discordRemaining: 0,
        damageBuff: 0,
        damageBuffRemaining: 0,
        atkSpeedBuff: 0,
        atkSpeedBuffRemaining: 0,
        regenRate: 0,
        regenRemaining: 0,
        undyingRemaining: 0,
        silenceRemaining: 0,
        reformUsed: true,
        abilityMult: 1,
        channel: null,
    };
    state.units.push(unit);
    state.byUid.set(unit.uid, unit);
    state.events.push({ type: 'summon', unit: unit.uid });
}

/**
 * Cells along the ray from `from` through `to`, extended to the board edge
 * (excludes the caster's own cell). Used by pierce abilities.
 */
function lineThrough(
    from: { row: number; col: number },
    to: { row: number; col: number },
): Set<number> {
    const out = new Set<number>();
    const [ax, az] = axial(from.row, from.col);
    const [bx, bz] = axial(to.row, to.col);
    const dist = Math.max(1, hexDistance(from.row, from.col, to.row, to.col));
    // Extend well past the target so the ray reaches the board edge.
    const steps = dist + 12;
    for (let i = 1; i <= steps; i++) {
        const t = i / dist;
        const cell = axialRound(ax + (bx - ax) * t, az + (bz - az) * t);
        if (!inBounds(cell.row, cell.col)) break;
        out.add(cellKey(cell.row, cell.col));
    }
    return out;
}

function axial(row: number, col: number): [number, number] {
    return [col - (row - (row & 1)) / 2, row];
}

function axialRound(x: number, z: number): { row: number; col: number } {
    const y = -x - z;
    let rx = Math.round(x);
    let ry = Math.round(y);
    let rz = Math.round(z);
    const dx = Math.abs(rx - x);
    const dy = Math.abs(ry - y);
    const dz = Math.abs(rz - z);
    if (dx > dy && dx > dz) rx = -ry - rz;
    else if (dy > dz) ry = -rx - rz;
    else rz = -rx - ry;
    const row = rz;
    const col = rx + (rz - (rz & 1)) / 2;
    return { row, col };
}

function checkEnd(state: CombatState): void {
    const pendingTeams = new Set(
        state.pendingRevives.map((p) => state.byUid.get(p.uid)?.team),
    );
    const playerAlive =
        state.units.some((u) => u.alive && u.team === 'player') ||
        pendingTeams.has('player');
    const enemyAlive =
        state.units.some((u) => u.alive && u.team === 'enemy') ||
        pendingTeams.has('enemy');
    if (!enemyAlive && playerAlive) state.phase = 'playerWin';
    else if (!playerAlive) state.phase = 'enemyWin';
}
