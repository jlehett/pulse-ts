import type { EnemyWaveDef } from './types';

/**
 * Authored enemy forces per floor (0-based; the act has 8 floors and floor
 * 7 is the Act Guardian). Battle nodes pick a variant for their floor;
 * elite nodes upgrade the wave via {@link eliteWave}.
 *
 * Enemy placements use rows 0-3 (the far half of the board): row 0 is the
 * enemy backline, row 3 their frontline.
 */
export const FLOOR_WAVES: EnemyWaveDef[][] = [
    // Floor 0
    [
        {
            name: 'Scrap Pickets',
            placements: [
                { unitId: 'widget', star: 1, row: 3, col: 2 },
                { unitId: 'widget', star: 1, row: 3, col: 4 },
                { unitId: 'piton', star: 1, row: 3, col: 3 },
            ],
        },
        {
            name: 'Stray Salvagers',
            placements: [
                { unitId: 'frostbit', star: 1, row: 3, col: 3 },
                { unitId: 'pips', star: 1, row: 1, col: 3 },
                { unitId: 'widget', star: 1, row: 3, col: 5 },
            ],
        },
    ],
    // Floor 1
    [
        {
            name: 'Salvage Party',
            placements: [
                { unitId: 'piton', star: 1, row: 3, col: 2 },
                { unitId: 'frostbit', star: 1, row: 3, col: 4 },
                { unitId: 'pips', star: 1, row: 1, col: 2 },
                { unitId: 'sparkplug', star: 1, row: 1, col: 4 },
            ],
        },
        {
            name: 'Picket Line',
            placements: [
                { unitId: 'piton', star: 1, row: 3, col: 1 },
                { unitId: 'piton', star: 1, row: 3, col: 5 },
                { unitId: 'widget', star: 1, row: 2, col: 3 },
                { unitId: 'pips', star: 1, row: 1, col: 3 },
            ],
        },
    ],
    // Floor 2
    [
        {
            name: 'Hostile Garrison',
            placements: [
                { unitId: 'piton', star: 2, row: 3, col: 3 },
                { unitId: 'dynamo', star: 1, row: 3, col: 1 },
                { unitId: 'pips', star: 1, row: 1, col: 2 },
                { unitId: 'coldsnap', star: 1, row: 0, col: 4 },
            ],
        },
        {
            name: 'Coolant Runners',
            placements: [
                { unitId: 'frostbit', star: 2, row: 3, col: 2 },
                { unitId: 'bulkhead', star: 1, row: 3, col: 4 },
                { unitId: 'coldsnap', star: 1, row: 0, col: 3 },
                { unitId: 'widget', star: 1, row: 2, col: 5 },
            ],
        },
    ],
    // Floor 3
    [
        {
            name: 'Junk Battery',
            placements: [
                { unitId: 'bulkhead', star: 1, row: 3, col: 2 },
                { unitId: 'piton', star: 2, row: 3, col: 4 },
                { unitId: 'ricochet', star: 1, row: 1, col: 1 },
                { unitId: 'ricochet', star: 1, row: 1, col: 5 },
                { unitId: 'sparkplug', star: 2, row: 0, col: 3 },
            ],
        },
        {
            name: 'Ghost Signal',
            placements: [
                { unitId: 'murmur', star: 1, row: 2, col: 2 },
                { unitId: 'murmur', star: 1, row: 2, col: 4 },
                { unitId: 'bulkhead', star: 1, row: 3, col: 3 },
                { unitId: 'pips', star: 2, row: 0, col: 3 },
                { unitId: 'coldsnap', star: 1, row: 0, col: 5 },
            ],
        },
    ],
    // Floor 4
    [
        {
            name: 'Foundry Detachment',
            placements: [
                { unitId: 'bulkhead', star: 2, row: 3, col: 3 },
                { unitId: 'dynamo', star: 2, row: 3, col: 1 },
                { unitId: 'ampere', star: 1, row: 1, col: 2 },
                { unitId: 'coldsnap', star: 1, row: 0, col: 4 },
                { unitId: 'murmur', star: 1, row: 2, col: 5 },
            ],
        },
        {
            name: 'Pressure Column',
            placements: [
                { unitId: 'piton', star: 2, row: 3, col: 2 },
                { unitId: 'bulkhead', star: 2, row: 3, col: 4 },
                { unitId: 'ricochet', star: 2, row: 1, col: 3 },
                { unitId: 'sparkplug', star: 2, row: 0, col: 2 },
                { unitId: 'pips', star: 2, row: 0, col: 4 },
            ],
        },
    ],
    // Floor 5
    [
        {
            name: 'Blizzard Cell',
            placements: [
                { unitId: 'deepfreeze', star: 1, row: 3, col: 3 },
                { unitId: 'whiteout', star: 1, row: 2, col: 1 },
                { unitId: 'whiteout', star: 1, row: 2, col: 5 },
                { unitId: 'coldsnap', star: 2, row: 0, col: 3 },
                { unitId: 'frostbit', star: 2, row: 3, col: 5 },
            ],
        },
        {
            name: 'Load-Bearing Wall',
            placements: [
                { unitId: 'bulkhead', star: 2, row: 3, col: 2 },
                { unitId: 'gridlock', star: 1, row: 1, col: 3 },
                { unitId: 'parallax', star: 1, row: 0, col: 5 },
                { unitId: 'dynamo', star: 2, row: 3, col: 4 },
                { unitId: 'ampere', star: 1, row: 1, col: 1 },
            ],
        },
    ],
    // Floor 6
    [
        {
            name: 'Vanguard Phalanx',
            placements: [
                { unitId: 'caldera', star: 1, row: 3, col: 3 },
                { unitId: 'deepfreeze', star: 1, row: 3, col: 1 },
                { unitId: 'parallax', star: 1, row: 0, col: 2 },
                { unitId: 'ampere', star: 2, row: 1, col: 4 },
                { unitId: 'ricochet', star: 2, row: 1, col: 6 },
                { unitId: 'piton', star: 2, row: 3, col: 5 },
            ],
        },
        {
            name: 'Executive Escort',
            placements: [
                { unitId: 'magnate', star: 1, row: 1, col: 3 },
                { unitId: 'bulkhead', star: 2, row: 3, col: 2 },
                { unitId: 'bulkhead', star: 2, row: 3, col: 4 },
                { unitId: 'whiteout', star: 1, row: 2, col: 1 },
                { unitId: 'parallax', star: 1, row: 0, col: 5 },
                { unitId: 'sparkplug', star: 2, row: 0, col: 1 },
            ],
        },
    ],
    // Floor 7 — Act Guardian
    [
        {
            name: 'NULLFRAME',
            placements: [
                { unitId: 'nullframe', star: 1, row: 3, col: 3 },
                { unitId: 'deepfreeze', star: 1, row: 3, col: 1 },
                { unitId: 'deepfreeze', star: 1, row: 3, col: 5 },
                { unitId: 'gridlock', star: 1, row: 1, col: 2 },
                { unitId: 'parallax', star: 1, row: 0, col: 4 },
            ],
        },
    ],
];

/** Per-floor multiplier applied to enemy hp/atk. */
export function floorScale(floor: number): number {
    return 1 + floor * 0.08;
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
