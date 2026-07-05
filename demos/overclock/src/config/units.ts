import type { UnitDef } from './types';

/**
 * The Overclock construct roster. Every unit carries one Manufacturer and
 * one Role trait. Costs 1-5 double as rarity tiers.
 *
 * Stat baselines by cost (1-star): HP ~500/650/800/950/1100, ATK scales
 * similarly; frontline roles trade ATK for HP/armor, backline the reverse.
 */
export const UNITS: UnitDef[] = [
    // ── Cost 1 ────────────────────────────────────────────────────────────
    {
        id: 'widget',
        name: 'Widget',
        cost: 1,
        manufacturer: 'scrapline',
        role: 'swarm',
        epithet: 'Salvage Skimmer',
        stats: {
            hp: 480,
            atk: 42,
            atkSpeed: 0.8,
            armor: 20,
            range: 2,
            manaMax: 60,
            manaStart: 0,
        },
        ability: {
            name: 'Part Cloud',
            description: 'Flings shrapnel at its target for 90 damage.',
            kind: 'strike',
            power: 90,
        },
    },
    {
        id: 'piton',
        name: 'Piton',
        cost: 1,
        manufacturer: 'ferrocrete',
        role: 'vanguard',
        epithet: 'Anchor Frame',
        stats: {
            hp: 620,
            atk: 45,
            atkSpeed: 0.65,
            armor: 45,
            range: 1,
            manaMax: 70,
            manaStart: 10,
        },
        ability: {
            name: 'Set Anchor',
            description: 'Bolts down, shielding itself for 180.',
            kind: 'shield',
            power: 180,
        },
    },
    {
        id: 'sparkplug',
        name: 'Sparkplug',
        cost: 1,
        manufacturer: 'hexawatt',
        role: 'catalyst',
        epithet: 'Charge Node',
        stats: {
            hp: 500,
            atk: 40,
            atkSpeed: 0.7,
            armor: 20,
            range: 3,
            manaMax: 50,
            manaStart: 0,
        },
        ability: {
            name: 'Jump Start',
            description: 'Zaps its target for 100 and grants allies 6 mana.',
            kind: 'surge',
            power: 100,
            aux: 6,
        },
    },
    {
        id: 'pips',
        name: 'Pips',
        cost: 1,
        manufacturer: 'whisperline',
        role: 'gunner',
        epithet: 'Spotter Rig',
        stats: {
            hp: 500,
            atk: 52,
            atkSpeed: 0.85,
            armor: 18,
            range: 3,
            manaMax: 65,
            manaStart: 0,
        },
        ability: {
            name: 'Double Tap',
            description: 'Fires a precise burst for 120 damage.',
            kind: 'strike',
            power: 120,
        },
    },
    {
        id: 'frostbit',
        name: 'Frostbit',
        cost: 1,
        manufacturer: 'cryostat',
        role: 'breacher',
        epithet: 'Coolant Saw',
        stats: {
            hp: 560,
            atk: 55,
            atkSpeed: 0.75,
            armor: 30,
            range: 1,
            manaMax: 70,
            manaStart: 10,
        },
        ability: {
            name: 'Cold Cut',
            description:
                'Saws its target for 130 and slows its attack speed 30% for 3s.',
            kind: 'chill',
            power: 130,
            aux: 0.3,
        },
    },

    // ── Cost 2 ────────────────────────────────────────────────────────────
    {
        id: 'bulkhead',
        name: 'Bulkhead',
        cost: 2,
        manufacturer: 'ferrocrete',
        role: 'vanguard',
        epithet: 'Pressure Wall',
        stats: {
            hp: 850,
            atk: 52,
            atkSpeed: 0.6,
            armor: 60,
            range: 1,
            manaMax: 80,
            manaStart: 20,
        },
        ability: {
            name: 'Seal Breach',
            description: 'Shields itself and adjacent allies for 220.',
            kind: 'shield',
            power: 220,
            aux: 1,
        },
    },
    {
        id: 'ricochet',
        name: 'Ricochet',
        cost: 2,
        manufacturer: 'scrapline',
        role: 'gunner',
        epithet: 'Junk Cannon',
        stats: {
            hp: 620,
            atk: 64,
            atkSpeed: 0.8,
            armor: 25,
            range: 3,
            manaMax: 70,
            manaStart: 0,
        },
        ability: {
            name: 'Bank Shot',
            description: 'A round that caroms between 3 enemies for 140 each.',
            kind: 'chain',
            power: 140,
            aux: 3,
        },
    },
    {
        id: 'coldsnap',
        name: 'Coldsnap',
        cost: 2,
        manufacturer: 'cryostat',
        role: 'longshot',
        epithet: 'Frost Rifle',
        stats: {
            hp: 580,
            atk: 72,
            atkSpeed: 0.7,
            armor: 20,
            range: 4,
            manaMax: 80,
            manaStart: 10,
        },
        ability: {
            name: 'Glacier Round',
            description:
                'Snipes its target for 210 and slows its attack speed 40% for 3s.',
            kind: 'chill',
            power: 210,
            aux: 0.4,
        },
    },
    {
        id: 'dynamo',
        name: 'Dynamo',
        cost: 2,
        manufacturer: 'hexawatt',
        role: 'breacher',
        epithet: 'Live-Wire Frame',
        stats: {
            hp: 700,
            atk: 66,
            atkSpeed: 0.8,
            armor: 35,
            range: 1,
            manaMax: 90,
            manaStart: 20,
        },
        ability: {
            name: 'Arc Slam',
            description: 'Discharges in a 1-hex nova for 170 damage.',
            kind: 'nova',
            power: 170,
            aux: 1,
        },
    },
    {
        id: 'murmur',
        name: 'Murmur',
        cost: 2,
        manufacturer: 'whisperline',
        role: 'swarm',
        epithet: 'Ghost Drone',
        stats: {
            hp: 560,
            atk: 58,
            atkSpeed: 0.9,
            armor: 18,
            range: 2,
            manaMax: 70,
            manaStart: 0,
        },
        ability: {
            name: 'Static Veil',
            description: 'Phases out, shielding itself for 240.',
            kind: 'shield',
            power: 240,
        },
    },

    // ── Cost 3 ────────────────────────────────────────────────────────────
    {
        id: 'gridlock',
        name: 'Gridlock',
        cost: 3,
        manufacturer: 'ferrocrete',
        role: 'catalyst',
        epithet: 'Load-Bearing Node',
        stats: {
            hp: 800,
            atk: 58,
            atkSpeed: 0.7,
            armor: 40,
            range: 2,
            manaMax: 70,
            manaStart: 10,
        },
        ability: {
            name: 'Power Route',
            description: 'Shocks its target for 190 and grants allies 10 mana.',
            kind: 'surge',
            power: 190,
            aux: 10,
        },
    },
    {
        id: 'whiteout',
        name: 'Whiteout',
        cost: 3,
        manufacturer: 'cryostat',
        role: 'swarm',
        epithet: 'Blizzard Cluster',
        stats: {
            hp: 720,
            atk: 62,
            atkSpeed: 0.95,
            armor: 25,
            range: 2,
            manaMax: 80,
            manaStart: 0,
        },
        ability: {
            name: 'Squall',
            description:
                'Kicks up a 1-hex frost nova for 200 that slows attack speed 25% for 3s.',
            kind: 'nova',
            power: 200,
            aux: 1,
        },
    },
    {
        id: 'parallax',
        name: 'Parallax',
        cost: 3,
        manufacturer: 'whisperline',
        role: 'longshot',
        epithet: 'Cloaked Optic',
        stats: {
            hp: 620,
            atk: 88,
            atkSpeed: 0.75,
            armor: 18,
            range: 5,
            manaMax: 90,
            manaStart: 0,
        },
        ability: {
            name: 'Trace Line',
            description:
                'A rail shot that pierces every enemy in a line for 260.',
            kind: 'pierce',
            power: 260,
        },
    },
    {
        id: 'ampere',
        name: 'Ampere',
        cost: 3,
        manufacturer: 'hexawatt',
        role: 'gunner',
        epithet: 'Beam Platform',
        stats: {
            hp: 680,
            atk: 74,
            atkSpeed: 0.85,
            armor: 28,
            range: 4,
            manaMax: 80,
            manaStart: 10,
        },
        ability: {
            name: 'Overdraw',
            description: 'Vents its capacitors at the target for 230 damage.',
            kind: 'strike',
            power: 230,
        },
    },

    // ── Cost 4 ────────────────────────────────────────────────────────────
    {
        id: 'magnate',
        name: 'Magnate',
        cost: 4,
        manufacturer: 'scrapline',
        role: 'catalyst',
        epithet: 'Gilded Executive',
        stats: {
            hp: 900,
            atk: 70,
            atkSpeed: 0.75,
            armor: 40,
            range: 3,
            manaMax: 90,
            manaStart: 20,
        },
        ability: {
            name: 'Hostile Buyout',
            description: 'Zaps its target for 280 and grants allies 14 mana.',
            kind: 'surge',
            power: 280,
            aux: 14,
        },
    },
    {
        id: 'caldera',
        name: 'Caldera',
        cost: 4,
        manufacturer: 'ferrocrete',
        role: 'breacher',
        epithet: 'Molten Wrecker',
        stats: {
            hp: 1050,
            atk: 90,
            atkSpeed: 0.75,
            armor: 50,
            range: 1,
            manaMax: 100,
            manaStart: 30,
        },
        ability: {
            name: 'Slag Vent',
            description: 'Erupts in a 2-hex nova for 300 damage.',
            kind: 'nova',
            power: 300,
            aux: 2,
        },
    },
    {
        id: 'deepfreeze',
        name: 'Deepfreeze',
        cost: 4,
        manufacturer: 'cryostat',
        role: 'vanguard',
        epithet: 'Cryo Colossus',
        stats: {
            hp: 1200,
            atk: 72,
            atkSpeed: 0.6,
            armor: 70,
            range: 1,
            manaMax: 90,
            manaStart: 20,
        },
        ability: {
            name: 'Flash Freeze',
            description:
                'Blasts a 1-hex nova for 240 that slows attack speed 40% for 3s.',
            kind: 'nova',
            power: 240,
            aux: 1,
        },
    },

    // ── Cost 5 ────────────────────────────────────────────────────────────
    {
        id: 'apogee',
        name: 'Apogee',
        cost: 5,
        manufacturer: 'whisperline',
        role: 'longshot',
        epithet: 'Orbital Deadeye',
        stats: {
            hp: 800,
            atk: 120,
            atkSpeed: 0.8,
            armor: 25,
            range: 6,
            manaMax: 110,
            manaStart: 20,
        },
        ability: {
            name: 'Terminal Arc',
            description:
                'A perfect rail shot piercing the line for 480 damage.',
            kind: 'pierce',
            power: 480,
        },
    },
    {
        id: 'gigavolt',
        name: 'Gigavolt',
        cost: 5,
        manufacturer: 'hexawatt',
        role: 'catalyst',
        epithet: 'Storm Core',
        stats: {
            hp: 1000,
            atk: 85,
            atkSpeed: 0.7,
            armor: 40,
            range: 3,
            manaMax: 100,
            manaStart: 30,
        },
        ability: {
            name: 'Grid Failure',
            description: 'Chain lightning arcs to 5 enemies for 320 each.',
            kind: 'chain',
            power: 320,
            aux: 5,
        },
    },

    // ── Enemy-only ────────────────────────────────────────────────────────
    {
        id: 'nullframe',
        name: 'Nullframe',
        cost: 5,
        manufacturer: 'ferrocrete',
        role: 'vanguard',
        epithet: 'Act Guardian',
        enemyOnly: true,
        stats: {
            hp: 4200,
            atk: 130,
            atkSpeed: 0.65,
            armor: 60,
            range: 2,
            manaMax: 110,
            manaStart: 20,
        },
        ability: {
            name: 'Null Cascade',
            description: 'Detonates a 2-hex nova for 380 damage.',
            kind: 'nova',
            power: 380,
            aux: 2,
        },
    },
];

/** Lookup of unit definitions by id. */
export const UNIT_BY_ID: ReadonlyMap<string, UnitDef> = new Map(
    UNITS.map((u) => [u.id, u]),
);

/** Shop-eligible roster (excludes enemy-only constructs). */
export const SHOP_UNITS: UnitDef[] = UNITS.filter((u) => !u.enemyOnly);

/** Multiplier applied to hp/atk/ability power per star above 1. */
export const STAR_MULTIPLIER = 1.8;

/**
 * Scales a base value for a star level (1-3).
 *
 * @param base - The 1-star value.
 * @param star - Star level.
 * @returns Scaled value.
 *
 * @example
 * starScale(100, 2); // 180
 */
export function starScale(base: number, star: number): number {
    return Math.round(base * Math.pow(STAR_MULTIPLIER, star - 1));
}
