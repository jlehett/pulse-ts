import type { AugmentDef, TraitId, UnitDef } from '../config/types';
import { TRAIT_BY_ID, activeTier } from '../config/traits';
import type { UnitMods } from './types';

/** Numeric effects per trait tier, mirroring the config descriptions. */
const MANUFACTURER_EFFECTS = {
    hexawatt: { startingMana: [15, 35], abilityPower: [0, 0.25] },
    ferrocrete: { armorPerSec: [4, 10] },
    whisperline: { critChance: [0.2, 0.45] },
    scrapline: { killGoldChance: [0.3, 0.6] },
    cryostat: { chillOnHit: [0.15, 0.3] },
} as const;

const ROLE_EFFECTS = {
    vanguard: { startShieldPct: [0.25, 0.5] },
    breacher: { atkPerSec: [4, 9] },
    gunner: { atkSpeedPerAttack: [0.04, 0.09] },
    longshot: { damagePerHex: [0.08, 0.15] },
    swarm: { dodgeChance: [0.15, 0.35] },
    catalyst: { manaRegen: [3, 7] },
} as const;

/** A summary row for HUD display. */
export interface TraitCount {
    id: TraitId;
    /** Unique units carrying the trait. */
    count: number;
    /** Active tier index (-1 when inactive). */
    tier: number;
}

/**
 * Counts unique units per trait for a team composition.
 *
 * @param defs - Unit definitions fielded (duplicates allowed; counted once).
 * @returns Trait counts sorted actives-first, then by count desc.
 */
export function countTraits(defs: UnitDef[]): TraitCount[] {
    const seen = new Set<string>();
    const counts = new Map<TraitId, number>();
    for (const def of defs) {
        if (seen.has(def.id)) continue;
        seen.add(def.id);
        counts.set(def.manufacturer, (counts.get(def.manufacturer) ?? 0) + 1);
        counts.set(def.role, (counts.get(def.role) ?? 0) + 1);
    }
    const rows: TraitCount[] = [];
    for (const [id, count] of counts) {
        const def = TRAIT_BY_ID.get(id)!;
        rows.push({ id, count, tier: activeTier(def, count) });
    }
    rows.sort((a, b) => {
        const aActive = a.tier >= 0 ? 1 : 0;
        const bActive = b.tier >= 0 ? 1 : 0;
        if (aActive !== bActive) return bActive - aActive;
        if (a.count !== b.count) return b.count - a.count;
        return a.id.localeCompare(b.id);
    });
    return rows;
}

/** Baseline (empty) modifier set. */
export function baseMods(): UnitMods {
    return {
        critChance: 0,
        dodgeChance: 0,
        manaRegen: 0,
        armorPerSec: 0,
        atkPerSec: 0,
        atkSpeedPerAttack: 0,
        chillOnHit: 0,
        damagePerHex: 0,
        startShieldPct: 0,
        killGoldChance: 0,
        abilityPower: 1,
        damageMult: 1,
    };
}

/** Extra starting mana granted by traits/augments (applied at setup). */
export interface TeamBonuses {
    startingMana: number;
    hp: number;
    atk: number;
    armor: number;
    atkSpeed: number;
}

/**
 * Computes per-unit combat modifiers for one team.
 *
 * Trait bonuses apply only to units carrying the trait; augment bonuses
 * (player team only) apply to everyone.
 *
 * @param defs - Definitions of all fielded units on the team.
 * @param augments - Active augments (empty for the enemy team).
 * @returns A function mapping a unit def to its modifiers, plus flat team
 * stat bonuses to fold in at unit creation.
 *
 * @example
 * const { modsFor, team } = computeTeamMods(defs, []);
 * const mods = modsFor(defs[0]);
 */
export function computeTeamMods(
    defs: UnitDef[],
    augments: AugmentDef[],
): {
    modsFor: (def: UnitDef) => UnitMods;
    team: TeamBonuses;
    traits: TraitCount[];
} {
    const traits = countTraits(defs);
    const tierOf = new Map<TraitId, number>();
    for (const t of traits) tierOf.set(t.id, t.tier);

    const team: TeamBonuses = {
        startingMana: 0,
        hp: 0,
        atk: 0,
        armor: 0,
        atkSpeed: 0,
    };
    const traitDamage = new Map<TraitId, number>();
    for (const aug of augments) {
        const e = aug.effect;
        switch (e.type) {
            case 'teamStat':
                team[e.stat] += e.amount;
                break;
            case 'startingMana':
                team.startingMana += e.amount;
                break;
            case 'traitDamage':
                traitDamage.set(
                    e.trait,
                    (traitDamage.get(e.trait) ?? 0) + e.amount,
                );
                break;
            default:
                break; // economy/run effects are handled by the run layer
        }
    }

    const modsFor = (def: UnitDef): UnitMods => {
        const mods = baseMods();

        const mTier = tierOf.get(def.manufacturer) ?? -1;
        if (mTier >= 0) {
            const m = MANUFACTURER_EFFECTS[def.manufacturer];
            if ('abilityPower' in m) mods.abilityPower += m.abilityPower[mTier];
            if ('armorPerSec' in m) mods.armorPerSec += m.armorPerSec[mTier];
            if ('critChance' in m) mods.critChance += m.critChance[mTier];
            if ('killGoldChance' in m)
                mods.killGoldChance += m.killGoldChance[mTier];
            if ('chillOnHit' in m)
                mods.chillOnHit = Math.max(
                    mods.chillOnHit,
                    m.chillOnHit[mTier],
                );
        }

        const rTier = tierOf.get(def.role) ?? -1;
        if (rTier >= 0) {
            const r = ROLE_EFFECTS[def.role];
            if ('startShieldPct' in r)
                mods.startShieldPct += r.startShieldPct[rTier];
            if ('atkPerSec' in r) mods.atkPerSec += r.atkPerSec[rTier];
            if ('atkSpeedPerAttack' in r)
                mods.atkSpeedPerAttack += r.atkSpeedPerAttack[rTier];
            if ('damagePerHex' in r) mods.damagePerHex += r.damagePerHex[rTier];
            if ('dodgeChance' in r) mods.dodgeChance += r.dodgeChance[rTier];
            if ('manaRegen' in r) mods.manaRegen += r.manaRegen[rTier];
        }

        for (const [trait, amount] of traitDamage) {
            if (def.manufacturer === trait || def.role === trait) {
                mods.damageMult += amount;
            }
        }

        return mods;
    };

    return { modsFor, team, traits };
}

/**
 * Extra starting mana for a unit from its manufacturer tier (Hexawatt).
 *
 * @param def - Unit definition.
 * @param traits - Team trait counts.
 * @returns Bonus starting mana.
 */
export function traitStartingMana(def: UnitDef, traits: TraitCount[]): number {
    if (def.manufacturer !== 'hexawatt') return 0;
    const row = traits.find((t) => t.id === 'hexawatt');
    if (!row || row.tier < 0) return 0;
    return MANUFACTURER_EFFECTS.hexawatt.startingMana[row.tier];
}
