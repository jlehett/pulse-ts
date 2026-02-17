export interface PlatformDef {
    position: [number, number, number];
    size: [number, number, number];
    color?: number;
}

export interface CollectibleDef {
    position: [number, number, number];
}

export interface LevelDef {
    playerSpawn: [number, number, number];
    deathPlaneY: number;
    platforms: PlatformDef[];
    collectibles: CollectibleDef[];
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

    collectibles: [
        { position: [7, 2.2, 0] },
        { position: [13, 3, 1] },
        { position: [18, 4, -1] },
        { position: [23, 5.2, 0] },
        { position: [34, 6.8, 0] },
    ],
};
