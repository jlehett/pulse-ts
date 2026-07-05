import type { AugmentDef } from '../config/types';
import { UNIT_BY_ID, starScale } from '../config/units';
import {
    cellKey,
    cellsWithin,
    hexDistance,
    inBounds,
    stepToward,
} from './grid';
import { computeTeamMods, traitStartingMana } from './traits';
import type { CombatState, CombatUnit, PlacedUnit, Team } from './types';

/** Seconds between movement steps. */
const MOVE_INTERVAL = 0.5;
/** Mana gained per auto-attack. */
const MANA_PER_ATTACK = 10;
/** Mana gained per point of damage taken (capped per hit). */
const MANA_PER_DAMAGE = 0.06;
const MANA_PER_HIT_CAP = 15;
/** Armor effectiveness against ability damage. */
const ABILITY_ARMOR_EFF = 0.5;
/** Critical strikes deal this multiplier. */
const CRIT_MULT = 1.5;
/** Chill applied by Cryostat casters' damaging abilities. */
const CRYO_CAST_CHILL = 0.3;
const CHILL_DURATION = 2;
const CAST_CHILL_DURATION = 3;
/** Max Scrapline gold drops per combat. */
const GOLD_DROP_CAP = 3;
/** Cap on gunner-style stacking attack speed. */
const ATK_SPEED_STACK_CAP = 10;

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
 * @param options - Teams, augments, scaling and RNG.
 * @returns A {@link CombatState} ready for {@link stepCombat}.
 *
 * @example
 * const state = createCombat({
 *     player: [{ uid: 'p0', defId: 'piton', star: 1, row: 4, col: 3 }],
 *     enemy: [{ uid: 'e0', defId: 'widget', star: 1, row: 3, col: 3 }],
 *     augments: [],
 *     enemyStatScale: 1,
 *     rng: Math.random,
 * });
 * while (state.phase === 'running') stepCombat(state, 1 / 30);
 */
export function createCombat(options: CombatOptions): CombatState {
    const units: CombatUnit[] = [];

    for (const team of ['player', 'enemy'] as Team[]) {
        const placed = team === 'player' ? options.player : options.enemy;
        const augments = team === 'player' ? options.augments : [];
        const scale = team === 'player' ? 1 : options.enemyStatScale;
        const defs = placed.map((p) => {
            const def = UNIT_BY_ID.get(p.defId);
            if (!def) throw new Error(`Unknown unit def: ${p.defId}`);
            return def;
        });
        const {
            modsFor,
            team: bonus,
            traits,
        } = computeTeamMods(defs, augments);

        placed.forEach((p, i) => {
            const def = defs[i];
            const mods = modsFor(def);
            const maxHp = Math.round(
                (starScale(def.stats.hp, p.star) + bonus.hp) * scale,
            );
            const atk = Math.round(
                (starScale(def.stats.atk, p.star) + bonus.atk) * scale,
            );
            const startMana = Math.min(
                def.stats.manaMax - MANA_PER_ATTACK,
                def.stats.manaStart +
                    traitStartingMana(def, traits) +
                    bonus.startingMana,
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
                shield: Math.round(maxHp * mods.startShieldPct),
                mana: Math.max(0, startMana),
                manaMax: def.stats.manaMax,
                atk,
                atkSpeed: def.stats.atkSpeed * (1 + bonus.atkSpeed),
                armor: def.stats.armor + bonus.armor,
                range: def.stats.range,
                mods,
                // Stagger first attacks slightly so rounds don't resolve in
                // perfect lockstep.
                attackCooldown: 0.3 + (units.length % 5) * 0.06,
                moveCooldown: 0,
                targetUid: null,
                atkSpeedStacks: 0,
                chillAmount: 0,
                chillRemaining: 0,
            });
        });
    }

    return {
        units,
        byUid: new Map(units.map((u) => [u.uid, u])),
        time: 0,
        phase: 'running',
        events: [],
        bonusGold: 0,
        rng: options.rng,
    };
}

/** Alive units on a team. */
export function aliveUnits(state: CombatState, team: Team): CombatUnit[] {
    return state.units.filter((u) => u.alive && u.team === team);
}

/** Effective attacks-per-second including stacks and chill. */
export function effectiveAtkSpeed(unit: CombatUnit): number {
    const chill = unit.chillRemaining > 0 ? unit.chillAmount : 0;
    return unit.atkSpeed * (1 + unit.atkSpeedStacks) * (1 - chill);
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

    for (const unit of state.units) {
        if (!unit.alive) continue;
        tickUnit(state, unit, dt);
        if (state.phase !== 'running') return;
    }

    checkEnd(state);
}

function tickUnit(state: CombatState, unit: CombatUnit, dt: number): void {
    // Ramps and status decay.
    unit.armor += unit.mods.armorPerSec * dt;
    unit.atk += unit.mods.atkPerSec * dt;
    if (unit.mods.manaRegen > 0) {
        unit.mana = Math.min(
            unit.manaMax,
            unit.mana + unit.mods.manaRegen * dt,
        );
    }
    if (unit.chillRemaining > 0) unit.chillRemaining -= dt;
    unit.attackCooldown -= dt;
    unit.moveCooldown -= dt;

    const target = acquireTarget(state, unit);
    if (!target) return;

    // Cast as soon as mana is full (requires a live target).
    if (unit.mana >= unit.manaMax) {
        castAbility(state, unit, target);
        return;
    }

    const dist = hexDistance(unit.row, unit.col, target.row, target.col);
    if (dist > unit.range) {
        if (unit.moveCooldown <= 0) {
            moveStep(state, unit, target);
        }
        return;
    }

    if (unit.attackCooldown <= 0) {
        performAttack(state, unit, target, dist);
        unit.attackCooldown = 1 / effectiveAtkSpeed(unit);
    }
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
    dist: number,
): void {
    state.events.push({
        type: 'attack',
        from: unit.uid,
        to: target.uid,
        ranged: unit.range > 1,
    });

    unit.mana = Math.min(unit.manaMax, unit.mana + MANA_PER_ATTACK);
    if (unit.mods.atkSpeedPerAttack > 0) {
        unit.atkSpeedStacks = Math.min(
            unit.mods.atkSpeedPerAttack * ATK_SPEED_STACK_CAP,
            unit.atkSpeedStacks + unit.mods.atkSpeedPerAttack,
        );
    }

    // Dodge check happens on the defender.
    if (target.mods.dodgeChance > 0 && state.rng() < target.mods.dodgeChance) {
        state.events.push({ type: 'dodge', target: target.uid });
        return;
    }

    let raw =
        unit.atk * (1 + unit.mods.damagePerHex * dist) * unit.mods.damageMult;
    let crit = false;
    if (unit.mods.critChance > 0 && state.rng() < unit.mods.critChance) {
        raw *= CRIT_MULT;
        crit = true;
    }

    applyDamage(state, unit, target, raw, 1, crit);

    if (unit.mods.chillOnHit > 0 && target.alive) {
        applyChill(target, unit.mods.chillOnHit, CHILL_DURATION);
    }
}

function applyChill(
    target: CombatUnit,
    amount: number,
    duration: number,
): void {
    if (amount >= target.chillAmount) {
        target.chillAmount = amount;
        target.chillRemaining = duration;
    }
}

/**
 * Applies mitigated damage to a target, handling shields, mana-on-damage,
 * death and Scrapline gold drops.
 */
function applyDamage(
    state: CombatState,
    source: CombatUnit,
    target: CombatUnit,
    raw: number,
    armorEff: number,
    crit: boolean,
): void {
    const armor = Math.max(0, target.armor * armorEff);
    const amount = Math.max(1, Math.round(raw * (100 / (100 + armor))));

    let remaining = amount;
    if (target.shield > 0) {
        const absorbed = Math.min(target.shield, remaining);
        target.shield -= absorbed;
        remaining -= absorbed;
    }
    target.hp -= remaining;
    target.mana = Math.min(
        target.manaMax,
        target.mana + Math.min(MANA_PER_HIT_CAP, amount * MANA_PER_DAMAGE),
    );
    state.events.push({
        type: 'hit',
        target: target.uid,
        amount,
        crit,
        source: source.uid,
    });

    if (target.hp <= 0) {
        target.hp = 0;
        target.alive = false;
        target.targetUid = null;
        state.events.push({ type: 'death', unit: target.uid });
        if (
            source.team === 'player' &&
            source.mods.killGoldChance > 0 &&
            state.bonusGold < GOLD_DROP_CAP &&
            state.rng() < source.mods.killGoldChance
        ) {
            state.bonusGold++;
            state.events.push({ type: 'goldDrop', unit: target.uid });
        }
    }
}

function castAbility(
    state: CombatState,
    unit: CombatUnit,
    target: CombatUnit,
): void {
    const ability = unit.def.ability;
    unit.mana = 0;
    state.events.push({
        type: 'cast',
        unit: unit.uid,
        ability: ability.name,
        kind: ability.kind,
    });

    const power =
        starScale(ability.power, unit.star) *
        unit.mods.abilityPower *
        unit.mods.damageMult;
    const enemies = () =>
        state.units.filter((u) => u.alive && u.team !== unit.team);
    const applyCryoChill = (victim: CombatUnit) => {
        if (unit.def.manufacturer === 'cryostat' && victim.alive) {
            applyChill(victim, CRYO_CAST_CHILL, CAST_CHILL_DURATION);
        }
    };

    switch (ability.kind) {
        case 'strike': {
            applyDamage(state, unit, target, power, ABILITY_ARMOR_EFF, false);
            applyCryoChill(target);
            break;
        }
        case 'chill': {
            applyDamage(state, unit, target, power, ABILITY_ARMOR_EFF, false);
            if (target.alive) {
                applyChill(target, ability.aux ?? 0.3, CAST_CHILL_DURATION);
            }
            break;
        }
        case 'nova': {
            const radius = ability.aux ?? 1;
            const cells = new Set(
                cellsWithin(unit.row, unit.col, radius).map((c) =>
                    cellKey(c.row, c.col),
                ),
            );
            for (const enemy of enemies()) {
                if (cells.has(cellKey(enemy.row, enemy.col))) {
                    applyDamage(
                        state,
                        unit,
                        enemy,
                        power,
                        ABILITY_ARMOR_EFF,
                        false,
                    );
                    applyCryoChill(enemy);
                }
            }
            break;
        }
        case 'chain': {
            const jumps = ability.aux ?? 3;
            const hit = new Set<string>();
            let current: CombatUnit | null = target;
            for (let i = 0; i < jumps && current; i++) {
                applyDamage(
                    state,
                    unit,
                    current,
                    power,
                    ABILITY_ARMOR_EFF,
                    false,
                );
                applyCryoChill(current);
                hit.add(current.uid);
                let next: CombatUnit | null = null;
                let bestDist = Infinity;
                for (const enemy of enemies()) {
                    if (hit.has(enemy.uid)) continue;
                    const d = hexDistance(
                        current.row,
                        current.col,
                        enemy.row,
                        enemy.col,
                    );
                    if (d < bestDist) {
                        bestDist = d;
                        next = enemy;
                    }
                }
                current = next;
            }
            break;
        }
        case 'pierce': {
            const cells = lineThrough(unit, target);
            for (const enemy of enemies()) {
                if (cells.has(cellKey(enemy.row, enemy.col))) {
                    applyDamage(
                        state,
                        unit,
                        enemy,
                        power,
                        ABILITY_ARMOR_EFF,
                        false,
                    );
                    applyCryoChill(enemy);
                }
            }
            break;
        }
        case 'shield': {
            const amount = Math.round(power);
            shieldUnit(state, unit, amount);
            if (ability.aux === 1) {
                for (const ally of state.units) {
                    if (
                        !ally.alive ||
                        ally.team !== unit.team ||
                        ally === unit
                    ) {
                        continue;
                    }
                    if (
                        hexDistance(unit.row, unit.col, ally.row, ally.col) ===
                        1
                    ) {
                        shieldUnit(state, ally, amount);
                    }
                }
            }
            break;
        }
        case 'surge': {
            applyDamage(state, unit, target, power, ABILITY_ARMOR_EFF, false);
            const mana = ability.aux ?? 0;
            for (const ally of state.units) {
                if (!ally.alive || ally.team !== unit.team || ally === unit)
                    continue;
                ally.mana = Math.min(ally.manaMax, ally.mana + mana);
            }
            break;
        }
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
    const playerAlive = state.units.some((u) => u.alive && u.team === 'player');
    const enemyAlive = state.units.some((u) => u.alive && u.team === 'enemy');
    if (!enemyAlive && playerAlive) state.phase = 'playerWin';
    else if (!playerAlive && enemyAlive) state.phase = 'enemyWin';
    else if (!playerAlive && !enemyAlive) state.phase = 'enemyWin';
}
