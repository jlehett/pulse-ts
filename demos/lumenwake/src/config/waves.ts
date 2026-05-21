import type { EnemyDef } from './enemies';
import { ENEMY_SHARD, ENEMY_NULLCUBE } from './enemies';

export interface WaveEntry {
    enemy: EnemyDef;
    count: number;
}

export interface WaveConfig {
    entries: WaveEntry[];
    spawnInterval: number;
    darknessLevel: number;
    sunStrength: number;
}

export const TOTAL_WAVES = 9;

export const WAVE_CONFIGS: WaveConfig[] = [
    // Wave 1 — intro: a handful of shards
    {
        entries: [{ enemy: ENEMY_SHARD, count: 6 }],
        spawnInterval: 0.6,
        darknessLevel: 0.05,
        sunStrength: 1.0,
    },
    // Wave 2 — more shards
    {
        entries: [{ enemy: ENEMY_SHARD, count: 10 }],
        spawnInterval: 0.5,
        darknessLevel: 0.1,
        sunStrength: 0.88,
    },
    // Wave 3 — first nullcubes
    {
        entries: [
            { enemy: ENEMY_SHARD, count: 8 },
            { enemy: ENEMY_NULLCUBE, count: 2 },
        ],
        spawnInterval: 0.5,
        darknessLevel: 0.15,
        sunStrength: 0.75,
    },
    // Wave 4 — pressure ramp
    {
        entries: [
            { enemy: ENEMY_SHARD, count: 12 },
            { enemy: ENEMY_NULLCUBE, count: 3 },
        ],
        spawnInterval: 0.4,
        darknessLevel: 0.22,
        sunStrength: 0.62,
    },
    // Wave 5 — midpoint
    {
        entries: [
            { enemy: ENEMY_SHARD, count: 14 },
            { enemy: ENEMY_NULLCUBE, count: 4 },
        ],
        spawnInterval: 0.35,
        darknessLevel: 0.3,
        sunStrength: 0.5,
    },
    // Wave 6 — heavy
    {
        entries: [
            { enemy: ENEMY_SHARD, count: 16 },
            { enemy: ENEMY_NULLCUBE, count: 5 },
        ],
        spawnInterval: 0.3,
        darknessLevel: 0.4,
        sunStrength: 0.38,
    },
    // Wave 7 — nullcube-heavy
    {
        entries: [
            { enemy: ENEMY_SHARD, count: 12 },
            { enemy: ENEMY_NULLCUBE, count: 8 },
        ],
        spawnInterval: 0.25,
        darknessLevel: 0.5,
        sunStrength: 0.25,
    },
    // Wave 8 — final regular wave, swarm
    {
        entries: [
            { enemy: ENEMY_SHARD, count: 20 },
            { enemy: ENEMY_NULLCUBE, count: 10 },
        ],
        spawnInterval: 0.2,
        darknessLevel: 0.6,
        sunStrength: 0.12,
    },
    // Wave 9 — boss wave (for now, a massive swarm until boss enemy exists)
    {
        entries: [
            { enemy: ENEMY_SHARD, count: 25 },
            { enemy: ENEMY_NULLCUBE, count: 15 },
        ],
        spawnInterval: 0.15,
        darknessLevel: 0.75,
        sunStrength: 0.05,
    },
];

/**
 * Scale enemy counts for player count.
 * Solo: 70% of base count. Each additional player adds 30%.
 */
export function scaleWaveForPlayers(
    wave: WaveConfig,
    playerCount: number,
): WaveConfig {
    const scale = 0.7 + 0.3 * playerCount;
    return {
        ...wave,
        entries: wave.entries.map((e) => ({
            ...e,
            count: Math.round(e.count * scale),
        })),
    };
}
