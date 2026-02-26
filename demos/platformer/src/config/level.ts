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

export interface LevelDef {
    playerSpawn: [number, number, number];
    deathPlaneY: number;
    platforms: PlatformDef[];
    movingPlatforms: MovingPlatformDef[];
    rotatingPlatforms: RotatingPlatformDef[];
    collectibles: CollectibleDef[];
    checkpoints: CheckpointDef[];
    hazards: HazardDef[];
    goalPosition: [number, number, number];
}

export const level: LevelDef = {
    playerSpawn: [0, 2, 0],
    deathPlaneY: -10,

    platforms: [
        // Starting platform — wide and welcoming
        { position: [0, 0, 0], size: [5, 0.4, 4], color: 0x4a6670 },

        // Gentle stepping stones
        { position: [7, 0.6, 0], size: [3, 0.4, 3], color: 0x5a7a84 },
        { position: [13, 1.4, 1], size: [2.5, 0.4, 2.5], color: 0x6a8a94 },
        { position: [18, 2.4, -1], size: [2.5, 0.4, 2.5], color: 0x5a7a84 },

        // Higher path
        { position: [23, 3.6, 0], size: [3, 0.4, 3], color: 0x4a6670 },
        { position: [28, 4.4, 2], size: [2, 0.4, 2], color: 0x6a8a94 },
        { position: [28, 4.4, -2], size: [2, 0.4, 2], color: 0x6a8a94 },

        // Final destination — large landing
        { position: [34, 5.2, 0], size: [4, 0.4, 4], color: 0x4a6670 },
    ],

    movingPlatforms: [
        // Horizontal ferry between the stepping-stone section and higher path
        {
            position: [20, 2.4, -3],
            target: [20, 2.4, 3],
            size: [2.5, 0.4, 2.5],
            color: 0x2e8b7a,
            speed: 3,
        },
        // Vertical lift near the final destination
        {
            position: [31, 3.0, 0],
            target: [31, 6.0, 0],
            size: [2, 0.4, 2],
            color: 0x2e8b7a,
            speed: 2,
        },
    ],

    rotatingPlatforms: [
        // Spinning platform mid-level as an optional shortcut
        {
            position: [23, 3.6, 3],
            size: [3, 0.4, 1.5],
            color: 0x7a4e8b,
            angularSpeed: 1.2,
        },
    ],

    collectibles: [
        { position: [7, 2.2, 0] },
        { position: [13, 3, 1] },
        { position: [18, 4, -1] },
        { position: [23, 5.2, 0] },
    ],

    checkpoints: [
        // After the stepping stones, before the higher path
        { position: [18, 3.0, -1] },
        // Before the final destination
        { position: [28, 5.0, 0] },
    ],

    hazards: [
        // Dangerous gap between stepping stones
        { position: [10, 0.2, 0], size: [2, 0.15, 3], color: 0xcc3300 },
        // Hazard on the higher path approach
        { position: [25.5, 3.8, 0], size: [1.5, 0.15, 3], color: 0xcc3300 },
    ],

    goalPosition: [34, 6.8, 0],
};
