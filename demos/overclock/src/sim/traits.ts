import type { AugmentDef, TraitId, UnitDef } from '../config/types';
import { TRAIT_BY_ID, activeTier } from '../config/traits';
import type { UnitMods } from './types';

/**
 * Numeric effects per trait tier, mirroring the config descriptions in
 * config/traits.ts. Adding a manufacturer or role means adding a row here
 * and a matching TraitDef there.
 */
const MANUFACTURER_EFFECTS = {
    aegisline: { startShieldFlat: [200, 450, 900], shieldedDamageBonus: 0.15 },
    redline: { atkSpeedFlat: [0.25, 0.6] },
    blacksite: { manaSiphon: [3, 7] },
    blastworks: { splashPct: [0.2, 0.4, 0.65] },
    hardlight: { reformPct: [0.15, 0.4] },
    vulture: { lifestealPct: [0.12, 0.22, 0.35] },
    surgecore: { rampDamage: [0.08, 0.18] },
} as const;

const ROLE_EFFECTS = {
    turret: { stationaryAtkSpeedPerSec: [0.07, 0.14] },
    flanker: { damagePerKill: [0.15, 0.35] },
    bulwark: { interceptPct: [0.15, 0.3], damageReduction: 0.15 },
    juggernaut: { regenPctPerSec: [0.015, 0.035] },
    breaker: { armorShredPerHit: [4, 9] },
    reaper: { executeDamageBonus: [0.45] },
    medic: { healBoost: [0.25, 0.6] },
    bombardier: { bombardierBonus: [0.5, 1.1] },
    amplifier: { discordOnHit: [0.1, 0.22] },
} as const;

/** Discord applied by Iris (Meridian's Prime trait). */
const IRIS_DISCORD = 0.2;
/** Splash fraction and range bonus granted by Emplacement (Citadel). */
const EMPLACEMENT_SPLASH = 0.5;
const EMPLACEMENT_RANGE = 2;
/** Starting-mana penalty inflicted on enemies by Zero-Day (Blackout). */
export const ZERO_DAY_MANA_PENALTY = 20;
/** Guardian Protocol revive parameters (Valkyr). */
export const GUARDIAN_REVIVE_PCT = 0.4;
export const GUARDIAN_REVIVE_DELAY = 2.5;
/** Attack speed permanently gained per kill by Bladeform (Kensei). */
const BLADEFORM_ATKSPEED_PER_KILL = 0.2;
/** Seconds between Surgecore ramp stacks. */
export const SURGE_RAMP_INTERVAL = 4;

/** A summary row for HUD display. */
export interface TraitCount {
    id: TraitId;
    /** Unique units carrying the trait. */
    count: number;
    /** Active tier index (-1 when inactive). */
    tier: number;
}

/**
 * Counts unique units per trait for a team composition. Tokens (summons)
 * never contribute; Primes contribute their unique trait.
 *
 * @param defs - Unit definitions fielded (duplicates allowed; counted once).
 * @returns Trait counts sorted actives-first, then by count desc.
 */
export function countTraits(defs: UnitDef[]): TraitCount[] {
    const seen = new Set<string>();
    const counts = new Map<TraitId, number>();
    for (const def of defs) {
        if (def.token || seen.has(def.id)) continue;
        seen.add(def.id);
        for (const id of [def.manufacturer, def.role, def.prime]) {
            if (id) counts.set(id, (counts.get(id) ?? 0) + 1);
        }
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
        damageMult: 1,
        startShieldFlat: 0,
        shieldedDamageBonus: 0,
        atkSpeedFlat: 0,
        manaSiphon: 0,
        splashPct: 0,
        reformPct: 0,
        stationaryAtkSpeedPerSec: 0,
        backlineSpawn: false,
        damagePerKill: 0,
        interceptPct: 0,
        damageReduction: 0,
        healBoost: 0,
        overhealShield: false,
        bombardierBonus: 0,
        discordOnHit: 0,
        discordPermanent: false,
        immobile: false,
        rangeBonus: 0,
        lifestealPct: 0,
        rampDamage: 0,
        regenPctPerSec: 0,
        armorShredPerHit: 0,
        executeDamageBonus: 0,
        atkSpeedPerKill: 0,
    };
}

/** Team-wide bonuses folded in at unit creation. */
export interface TeamBonuses {
    startingMana: number;
    hp: number;
    atk: number;
    armor: number;
    atkSpeed: number;
    /** Whether the team fields Guardian Protocol (Valkyr). */
    guardianRevive: boolean;
}

/**
 * Computes per-unit combat modifiers for one team.
 *
 * Trait bonuses apply only to units carrying the trait; augment bonuses
 * (player team only) apply to everyone. Prime passives apply to the Prime
 * unit itself (team-level Prime effects surface in {@link TeamBonuses} or
 * are handled by the sim).
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
        guardianRevive: defs.some((d) => d.prime === 'guardian-protocol'),
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

        const mTier = def.manufacturer
            ? (tierOf.get(def.manufacturer) ?? -1)
            : -1;
        if (def.manufacturer && mTier >= 0) {
            switch (def.manufacturer) {
                case 'aegisline': {
                    const m = MANUFACTURER_EFFECTS.aegisline;
                    mods.startShieldFlat += m.startShieldFlat[mTier];
                    mods.shieldedDamageBonus += m.shieldedDamageBonus;
                    break;
                }
                case 'redline':
                    mods.atkSpeedFlat +=
                        MANUFACTURER_EFFECTS.redline.atkSpeedFlat[mTier];
                    break;
                case 'blacksite':
                    mods.manaSiphon +=
                        MANUFACTURER_EFFECTS.blacksite.manaSiphon[mTier];
                    break;
                case 'blastworks':
                    mods.splashPct = Math.max(
                        mods.splashPct,
                        MANUFACTURER_EFFECTS.blastworks.splashPct[mTier],
                    );
                    break;
                case 'hardlight':
                    mods.reformPct =
                        MANUFACTURER_EFFECTS.hardlight.reformPct[mTier];
                    break;
                case 'vulture':
                    mods.lifestealPct +=
                        MANUFACTURER_EFFECTS.vulture.lifestealPct[mTier];
                    break;
                case 'surgecore':
                    mods.rampDamage +=
                        MANUFACTURER_EFFECTS.surgecore.rampDamage[mTier];
                    break;
            }
        }

        const rTier = def.role ? (tierOf.get(def.role) ?? -1) : -1;
        if (def.role && rTier >= 0) {
            switch (def.role) {
                case 'turret':
                    mods.stationaryAtkSpeedPerSec +=
                        ROLE_EFFECTS.turret.stationaryAtkSpeedPerSec[rTier];
                    break;
                case 'flanker':
                    mods.backlineSpawn = true;
                    mods.damagePerKill +=
                        ROLE_EFFECTS.flanker.damagePerKill[rTier];
                    break;
                case 'bulwark':
                    mods.interceptPct +=
                        ROLE_EFFECTS.bulwark.interceptPct[rTier];
                    mods.damageReduction = Math.max(
                        mods.damageReduction,
                        ROLE_EFFECTS.bulwark.damageReduction,
                    );
                    break;
                case 'juggernaut':
                    mods.regenPctPerSec +=
                        ROLE_EFFECTS.juggernaut.regenPctPerSec[rTier];
                    break;
                case 'breaker':
                    mods.armorShredPerHit +=
                        ROLE_EFFECTS.breaker.armorShredPerHit[rTier];
                    break;
                case 'reaper':
                    mods.executeDamageBonus +=
                        ROLE_EFFECTS.reaper.executeDamageBonus[rTier];
                    break;
                case 'medic':
                    mods.healBoost += ROLE_EFFECTS.medic.healBoost[rTier];
                    mods.overhealShield = true;
                    break;
                case 'bombardier':
                    mods.bombardierBonus +=
                        ROLE_EFFECTS.bombardier.bombardierBonus[rTier];
                    break;
                case 'amplifier':
                    mods.discordOnHit = Math.max(
                        mods.discordOnHit,
                        ROLE_EFFECTS.amplifier.discordOnHit[rTier],
                    );
                    break;
            }
        }

        // Prime passives are per-unit and always active.
        if (def.prime === 'iris') {
            mods.discordOnHit = Math.max(mods.discordOnHit, IRIS_DISCORD);
            mods.discordPermanent = true;
        } else if (def.prime === 'emplacement') {
            mods.immobile = true;
            mods.rangeBonus += EMPLACEMENT_RANGE;
            mods.splashPct = Math.max(mods.splashPct, EMPLACEMENT_SPLASH);
        } else if (def.prime === 'bladeform') {
            mods.atkSpeedPerKill = BLADEFORM_ATKSPEED_PER_KILL;
        }

        for (const [trait, amount] of traitDamage) {
            if (
                def.manufacturer === trait ||
                def.role === trait ||
                def.prime === trait
            ) {
                mods.damageMult += amount;
            }
        }

        return mods;
    };

    return { modsFor, team, traits };
}

/**
 * Whether a team composition fields a given Prime trait.
 *
 * @param defs - Unit definitions fielded by the team.
 * @param prime - Prime trait id to look for.
 * @returns True when any def carries the Prime trait.
 *
 * @example
 * hasPrime(defs, 'zero-day');
 */
export function hasPrime(defs: UnitDef[], prime: string): boolean {
    return defs.some((d) => d.prime === prime);
}
