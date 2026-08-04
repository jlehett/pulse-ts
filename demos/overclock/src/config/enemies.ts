import type { EnemyWaveDef } from './types';

/**
 * Authored enemy forces per floor (0-based; the act has 8 floors and floor
 * 7 is the Act Guardian). Battle nodes pick a variant for their floor;
 * elite nodes upgrade the wave via {@link eliteWave}.
 *
 * Enemy placements use rows 0-3 (the far half of the board): row 0 is the
 * enemy backline, row 3 their frontline.
 *
 * Floors 0-2 field enemy-only scrap fodder (scrap/stinger/husk) — trait-less
 * units that never cast — so the opening fights stay easy and tunable
 * independent of player-roster balance. Real constructs phase in on floor 2.
 *
 * Star-tier ramp: floors 0-4 are all 1-star (a player fielding 1-star copies
 * shouldn't face 1.8x-stat 2-star enemies before they can combine their own).
 * Floors 5-6 seed a single 2-star "anchor" per wave for threat; the Act
 * Guardian on floor 7 carries the fight through its Prime, not star tiers.
 */
export const FLOOR_WAVES: EnemyWaveDef[][] = [
    // Floor 0
    [
        {
            name: 'Scrap Strays',
            placements: [
                { unitId: 'scrap', star: 1, row: 3, col: 2 },
                { unitId: 'scrap', star: 1, row: 3, col: 4 },
                { unitId: 'stinger', star: 1, row: 1, col: 3 },
            ],
        },
        {
            name: 'Salvage Pickets',
            placements: [
                { unitId: 'scrap', star: 1, row: 3, col: 3 },
                { unitId: 'stinger', star: 1, row: 1, col: 2 },
                { unitId: 'stinger', star: 1, row: 1, col: 4 },
            ],
        },
    ],
    // Floor 1
    [
        {
            name: 'Scrap Column',
            placements: [
                { unitId: 'husk', star: 1, row: 3, col: 3 },
                { unitId: 'scrap', star: 1, row: 3, col: 1 },
                { unitId: 'scrap', star: 1, row: 3, col: 5 },
                { unitId: 'stinger', star: 1, row: 1, col: 3 },
            ],
        },
        {
            name: 'Wasp Nest',
            placements: [
                { unitId: 'scrap', star: 1, row: 3, col: 2 },
                { unitId: 'scrap', star: 1, row: 3, col: 4 },
                { unitId: 'stinger', star: 1, row: 1, col: 1 },
                { unitId: 'stinger', star: 1, row: 1, col: 5 },
            ],
        },
    ],
    // Floor 2 — first real constructs, still padded with fodder
    [
        {
            name: 'Forge Escort',
            placements: [
                { unitId: 'husk', star: 1, row: 3, col: 2 },
                { unitId: 'scrap', star: 1, row: 3, col: 4 },
                { unitId: 'tripod', star: 1, row: 1, col: 3 },
                { unitId: 'stinger', star: 1, row: 0, col: 5 },
            ],
        },
        {
            name: 'Salvage Crew',
            placements: [
                { unitId: 'chock', star: 1, row: 3, col: 3 },
                { unitId: 'scrap', star: 1, row: 3, col: 1 },
                { unitId: 'scrap', star: 1, row: 3, col: 5 },
                { unitId: 'gauze', star: 1, row: 0, col: 3 },
            ],
        },
    ],
    // Floor 3
    [
        {
            name: 'Arc Battery',
            placements: [
                { unitId: 'ramrod', star: 1, row: 3, col: 2 },
                { unitId: 'chock', star: 1, row: 3, col: 4 },
                { unitId: 'mortar', star: 1, row: 1, col: 1 },
                { unitId: 'mortar', star: 1, row: 1, col: 5 },
                { unitId: 'gauze', star: 1, row: 0, col: 3 },
            ],
        },
        {
            name: 'Refraction Cell',
            placements: [
                { unitId: 'wisp', star: 1, row: 2, col: 2 },
                { unitId: 'wisp', star: 1, row: 2, col: 4 },
                { unitId: 'ramrod', star: 1, row: 3, col: 3 },
                { unitId: 'relay', star: 1, row: 0, col: 3 },
                { unitId: 'static', star: 1, row: 0, col: 5 },
            ],
        },
    ],
    // Floor 4
    [
        {
            name: 'Siege Detachment',
            placements: [
                { unitId: 'ramrod', star: 1, row: 3, col: 3 },
                { unitId: 'gaffhook', star: 1, row: 3, col: 1 },
                { unitId: 'bastille', star: 1, row: 1, col: 2 },
                { unitId: 'mortar', star: 1, row: 0, col: 4 },
                { unitId: 'sawbones', star: 1, row: 0, col: 2 },
            ],
        },
        {
            name: 'Salvage Column',
            placements: [
                { unitId: 'chock', star: 1, row: 3, col: 2 },
                { unitId: 'gaffhook', star: 1, row: 3, col: 4 },
                { unitId: 'picket', star: 1, row: 1, col: 3 },
                { unitId: 'relay', star: 1, row: 0, col: 2 },
                { unitId: 'fuze', star: 1, row: 0, col: 4 },
            ],
        },
    ],
    // Floor 5
    [
        {
            name: 'Overwatch Nest',
            placements: [
                { unitId: 'gaffhook', star: 1, row: 3, col: 3 },
                { unitId: 'cinder', star: 1, row: 2, col: 1 },
                { unitId: 'cinder', star: 1, row: 2, col: 5 },
                { unitId: 'vantage', star: 1, row: 0, col: 3 },
                { unitId: 'wisp', star: 2, row: 3, col: 5 },
            ],
        },
        {
            name: 'Sound System',
            placements: [
                { unitId: 'ramrod', star: 2, row: 3, col: 2 },
                { unitId: 'gaffhook', star: 1, row: 3, col: 4 },
                { unitId: 'pulsar', star: 1, row: 1, col: 3 },
                { unitId: 'loom', star: 1, row: 0, col: 5 },
                { unitId: 'bastille', star: 1, row: 1, col: 1 },
            ],
        },
    ],
    // Floor 6
    [
        {
            name: 'Gravity Phalanx',
            placements: [
                { unitId: 'gravitas', star: 1, row: 3, col: 3 },
                { unitId: 'gaffhook', star: 1, row: 3, col: 1 },
                { unitId: 'vantage', star: 1, row: 0, col: 2 },
                { unitId: 'warhead', star: 1, row: 1, col: 4 },
                { unitId: 'mortar', star: 2, row: 1, col: 6 },
                { unitId: 'chock', star: 1, row: 3, col: 5 },
            ],
        },
        {
            name: 'Night Shift',
            placements: [
                { unitId: 'nocturne', star: 1, row: 1, col: 3 },
                { unitId: 'ramrod', star: 2, row: 3, col: 2 },
                { unitId: 'gravitas', star: 1, row: 3, col: 4 },
                { unitId: 'cinder', star: 1, row: 2, col: 1 },
                { unitId: 'lifeline', star: 1, row: 0, col: 5 },
                { unitId: 'static', star: 1, row: 0, col: 1 },
            ],
        },
    ],
    // Floor 7 — Act Guardian
    [
        {
            name: 'AXIOM',
            placements: [
                { unitId: 'axiom', star: 1, row: 3, col: 3 },
                { unitId: 'gravitas', star: 1, row: 3, col: 1 },
                { unitId: 'gravitas', star: 1, row: 3, col: 5 },
                { unitId: 'lifeline', star: 1, row: 1, col: 2 },
                { unitId: 'vantage', star: 1, row: 0, col: 4 },
            ],
        },
    ],
];

/** Gentle on-ramp for the first floors (player board is still tiny). */
const EARLY_FLOOR_SCALE = [0.8, 0.9, 1];

/**
 * Per-floor multiplier applied to enemy hp/atk. Flat through the padded
 * early floors, then a gentle linear ramp (floor 7 lands at ~1.3×).
 */
export function floorScale(floor: number): number {
    return EARLY_FLOOR_SCALE[floor] ?? 1 + (floor - 2) * 0.06;
}

/** Extra multiplier and naming applied to elite encounters. */
export const ELITE_STAT_SCALE = 1.3;

/**
 * Upgrades a floor wave into an elite encounter.
 *
 * @param wave - Base wave for the floor.
 * @returns A renamed, stat-boosted copy.
 */
export function eliteWave(wave: EnemyWaveDef): EnemyWaveDef {
    return {
        name: `Elite · ${wave.name}`,
        placements: wave.placements,
        statScale: (wave.statScale ?? 1) * ELITE_STAT_SCALE,
    };
}
