export interface PlatformDef {
    position: [number, number, number];
    size: [number, number, number];
    color?: number;
}

export interface MovingPlatformDef {
    position: [number, number, number];
    /** World-space destination; platform oscillates between position and target. */
    target: [number, number, number];
    size: [number, number, number];
    color?: number;
    /** Travel speed in world units/second. Default: 3. */
    speed?: number;
}

export interface RotatingPlatformDef {
    position: [number, number, number];
    size: [number, number, number];
    color?: number;
    /** Angular speed in radians/second around the Y axis. Default: 1.0. */
    angularSpeed?: number;
}

export interface CollectibleDef {
    position: [number, number, number];
}

export interface CheckpointDef {
    position: [number, number, number];
}

export interface HazardDef {
    position: [number, number, number];
    size: [number, number, number];
    color?: number;
}

export interface EnemyDef {
    position: [number, number, number];
    /** World-space destination; enemy patrols between position and target. */
    target: [number, number, number];
    size: [number, number, number];
    color?: number;
    /** Patrol speed in world units/second. Default: 2. */
    speed?: number;
}

export interface LevelDef {
    playerSpawn: [number, number, number];
    deathPlaneY: number;
    platforms: PlatformDef[];
    movingPlatforms: MovingPlatformDef[];
    rotatingPlatforms: RotatingPlatformDef[];
    collectibles: CollectibleDef[];
    checkpoints: CheckpointDef[];
    hazards: HazardDef[];
    enemies: EnemyDef[];
    goalPosition: [number, number, number];
}

export const level: LevelDef = {
    playerSpawn: [0, 2, 0],
    deathPlaneY: -10,

    platforms: [
        // ── Stage 1 — Tutorial (X: 0–18) ──────────────────────────
        // Pure movement/jumping, no hazards or enemies
        { position: [0, 0, 0], size: [5, 0.4, 4], color: 0x4a6670 },
        { position: [6, 0.4, 0], size: [3, 0.4, 3], color: 0x5a7a84 },
        { position: [11, 1.0, 0], size: [3, 0.4, 3], color: 0x6a8a94 },
        { position: [15, 1.8, 0], size: [3, 0.4, 3], color: 0x5a7a84 },
        { position: [18, 0.5, 0], size: [4, 0.4, 4], color: 0x4a6670 },

        // ── Stage 2 — Intermediate (X: 22–42) ─────────────────────
        // Moving platforms, rotating platform, hazards, and an enemy
        { position: [22, 0.5, 0], size: [4, 0.4, 4], color: 0x4a6670 },
        { position: [27, 1.2, 0], size: [3, 0.4, 3], color: 0x5a7a84 },
        { position: [33, 1.8, 0], size: [3, 0.4, 3], color: 0x6a8a94 },
        { position: [37, 2.4, 0], size: [3, 0.4, 3], color: 0x5a7a84 },
        { position: [42, 5.0, 0], size: [4, 0.4, 4], color: 0x4a6670 },

        // ── Stage 3 — Advanced (X: 46–65) ─────────────────────────
        // Dash-required gap, multiple enemies, all mechanics combined
        { position: [46, 1.0, 0], size: [4, 0.4, 4], color: 0x4a6670 },
        { position: [50, 1.6, 0], size: [3, 0.4, 3], color: 0x5a7a84 },
        // Dash gap: 53.5 edge → 59.25 edge = 5.75 units (normal jump max ~4.5)
        { position: [61, 1.6, 0], size: [3.5, 0.4, 3], color: 0x6a8a94 },
        { position: [65, 2.2, 0], size: [4, 0.4, 4], color: 0x4a6670 },
        // Safety-net elevator platform below the dash gap (catches falls)
        { position: [57, -3, 0], size: [4, 0.4, 3], color: 0x3a5660 },
    ],

    movingPlatforms: [
        // Stage 2: horizontal ferry Z-axis between static platforms
        {
            position: [30, 1.5, -2],
            target: [30, 1.5, 2],
            size: [2.5, 0.4, 2.5],
            color: 0x2e8b7a,
            speed: 2.5,
        },
        // Stage 2: vertical lift to the cliff top — big drop into Stage 3
        {
            position: [40, 1.2, 0],
            target: [40, 5.0, 0],
            size: [2, 0.4, 2],
            color: 0x2e8b7a,
            speed: 2,
        },
        // Stage 3: horizontal ferry across a gap
        {
            position: [48, 1.3, -2],
            target: [48, 1.3, 2],
            size: [2, 0.4, 2],
            color: 0x2e8b7a,
            speed: 3,
        },
        // Stage 3: safety-net elevator — carries player back up after falling
        {
            position: [57, -3, 0],
            target: [57, 1.6, 0],
            size: [3, 0.4, 3],
            color: 0x2e8b7a,
            speed: 2,
        },
    ],

    rotatingPlatforms: [
        // Stage 2: optional shortcut — spinning platform bypasses the ferry
        {
            position: [30, 1.5, 3.5],
            size: [3, 0.4, 1.5],
            color: 0x7a4e8b,
            angularSpeed: 1.2,
        },
    ],

    collectibles: [
        // Stage 1 — 3 collectibles
        { position: [6, 2, 0] },
        { position: [11, 2.6, 0] },
        { position: [15, 3.4, 0] },
        // Stage 2 — 3 collectibles
        { position: [27, 2.8, 0] },
        { position: [33, 3.4, 0] },
        { position: [40, 6.6, 0] },
        // Stage 3 — 2 collectibles
        { position: [50, 3.2, 0] },
        { position: [61, 3.2, 0] },
    ],

    checkpoints: [
        // End of Stage 1
        { position: [18, 1.1, 0] },
        // End of Stage 2 — on the cliff top
        { position: [42, 5.6, 0] },
    ],

    hazards: [
        // Stage 2: gap hazard between platforms at X: 29
        { position: [29.5, 0.2, 0], size: [2, 0.15, 3], color: 0xcc3300 },
        // Stage 2: floor hazard on approach to vertical lift
        { position: [35, 2.0, 0], size: [1.5, 0.15, 3], color: 0xcc3300 },
        // Stage 3: floor hazard under the dash gap (punishes hesitation)
        { position: [57, -0.2, 0], size: [4, 0.15, 3], color: 0xcc3300 },
        // Stage 3: hazard before goal platform
        { position: [63, 1.8, 0], size: [1.5, 0.15, 3], color: 0xcc3300 },
    ],

    enemies: [
        // Stage 2: patrols Z-axis on the middle platform
        {
            position: [33, 2.6, -1],
            target: [33, 2.6, 1],
            size: [0.6, 0.8, 0.6],
            speed: 1.5,
        },
        // Stage 3: patrols Z-axis on the dash landing platform
        {
            position: [61, 2.4, -1],
            target: [61, 2.4, 1],
            size: [0.6, 0.8, 0.6],
            speed: 2,
        },
        // Stage 3: guards the goal platform
        {
            position: [65, 3.0, -1.5],
            target: [65, 3.0, 1.5],
            size: [0.6, 0.8, 0.6],
            speed: 2.5,
        },
    ],

    goalPosition: [65, 3.8, 0],
};
