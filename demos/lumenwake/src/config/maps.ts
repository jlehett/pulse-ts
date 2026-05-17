/**
 * Spherical coordinates for placing things on the planetoid surface.
 * theta = polar angle from north pole (0 = top, PI = bottom)
 * phi = azimuthal angle around the equator (0 to 2PI)
 */
export interface SphereCoord {
    theta: number;
    phi: number;
}

export interface ObstacleConfig {
    coord: SphereCoord;
    type: 'pillar' | 'wall' | 'crystal';
    height?: number;
    radius?: number;
    width?: number;
}

export interface SpawnPoint {
    coord: SphereCoord;
}

export interface MapConfig {
    id: string;
    name: string;
    sphereRadius: number;
    surfaceColor: number;
    emissiveColor: number;
    obstacles: ObstacleConfig[];
    enemySpawns: SpawnPoint[];
    playerSpawns: SphereCoord[];
}

/**
 * Convert sphere coordinates to a 3D position on the sphere surface.
 */
export function sphereToWorld(
    coord: SphereCoord,
    radius: number,
): [x: number, y: number, z: number] {
    const x = radius * Math.sin(coord.theta) * Math.cos(coord.phi);
    const y = radius * Math.cos(coord.theta);
    const z = radius * Math.sin(coord.theta) * Math.sin(coord.phi);
    return [x, y, z];
}

/**
 * Get the surface normal (outward) at a point on the sphere.
 */
export function sphereNormal(
    coord: SphereCoord,
): [x: number, y: number, z: number] {
    const x = Math.sin(coord.theta) * Math.cos(coord.phi);
    const y = Math.cos(coord.theta);
    const z = Math.sin(coord.theta) * Math.sin(coord.phi);
    return [x, y, z];
}

const PI = Math.PI;
const TAU = PI * 2;

export const MAP_NEXUS: MapConfig = {
    id: 'nexus',
    name: 'Nexus',
    sphereRadius: 12,
    surfaceColor: 0x0a0a1f,
    emissiveColor: 0x1a3355,
    obstacles: [
        { coord: { theta: PI * 0.5, phi: 0 }, type: 'pillar', height: 2, radius: 0.8 },
        { coord: { theta: PI * 0.5, phi: PI }, type: 'pillar', height: 2, radius: 0.8 },
        { coord: { theta: PI * 0.5, phi: PI * 0.5 }, type: 'pillar', height: 2, radius: 0.8 },
        { coord: { theta: PI * 0.5, phi: PI * 1.5 }, type: 'pillar', height: 2, radius: 0.8 },
        { coord: { theta: PI * 0.3, phi: 0 }, type: 'crystal', height: 1.5, radius: 0.5 },
        { coord: { theta: PI * 0.3, phi: PI }, type: 'crystal', height: 1.5, radius: 0.5 },
        { coord: { theta: PI * 0.7, phi: PI * 0.5 }, type: 'crystal', height: 1.5, radius: 0.5 },
        { coord: { theta: PI * 0.7, phi: PI * 1.5 }, type: 'crystal', height: 1.5, radius: 0.5 },
    ],
    enemySpawns: [
        { coord: { theta: PI * 0.2, phi: 0 } },
        { coord: { theta: PI * 0.2, phi: TAU * 0.25 } },
        { coord: { theta: PI * 0.2, phi: TAU * 0.5 } },
        { coord: { theta: PI * 0.2, phi: TAU * 0.75 } },
        { coord: { theta: PI * 0.8, phi: 0 } },
        { coord: { theta: PI * 0.8, phi: TAU * 0.25 } },
        { coord: { theta: PI * 0.8, phi: TAU * 0.5 } },
        { coord: { theta: PI * 0.8, phi: TAU * 0.75 } },
    ],
    playerSpawns: [
        { theta: PI * 0.5, phi: TAU * 0.125 },
        { theta: PI * 0.5, phi: TAU * 0.375 },
        { theta: PI * 0.5, phi: TAU * 0.625 },
        { theta: PI * 0.5, phi: TAU * 0.875 },
    ],
};

export const MAP_FRACTURE: MapConfig = {
    id: 'fracture',
    name: 'Fracture',
    sphereRadius: 10,
    surfaceColor: 0x0f0a1a,
    emissiveColor: 0x442255,
    obstacles: [
        { coord: { theta: PI * 0.4, phi: 0 }, type: 'wall', height: 2, width: 3 },
        { coord: { theta: PI * 0.4, phi: PI }, type: 'wall', height: 2, width: 3 },
        { coord: { theta: PI * 0.6, phi: PI * 0.5 }, type: 'wall', height: 2, width: 3 },
        { coord: { theta: PI * 0.6, phi: PI * 1.5 }, type: 'wall', height: 2, width: 3 },
        { coord: { theta: PI * 0.5, phi: PI * 0.25 }, type: 'pillar', height: 2.5, radius: 0.6 },
        { coord: { theta: PI * 0.5, phi: PI * 1.25 }, type: 'pillar', height: 2.5, radius: 0.6 },
    ],
    enemySpawns: [
        { coord: { theta: PI * 0.15, phi: 0 } },
        { coord: { theta: PI * 0.15, phi: TAU * 0.33 } },
        { coord: { theta: PI * 0.15, phi: TAU * 0.67 } },
        { coord: { theta: PI * 0.85, phi: TAU * 0.17 } },
        { coord: { theta: PI * 0.85, phi: TAU * 0.5 } },
        { coord: { theta: PI * 0.85, phi: TAU * 0.83 } },
    ],
    playerSpawns: [
        { theta: PI * 0.5, phi: 0 },
        { theta: PI * 0.5, phi: TAU * 0.25 },
        { theta: PI * 0.5, phi: TAU * 0.5 },
        { theta: PI * 0.5, phi: TAU * 0.75 },
    ],
};

export const MAP_CONVERGENCE: MapConfig = {
    id: 'convergence',
    name: 'Convergence',
    sphereRadius: 15,
    surfaceColor: 0x0a1a0f,
    emissiveColor: 0x225544,
    obstacles: [
        { coord: { theta: PI * 0.35, phi: 0 }, type: 'crystal', height: 3, radius: 1.0 },
        { coord: { theta: PI * 0.35, phi: TAU / 3 }, type: 'crystal', height: 3, radius: 1.0 },
        { coord: { theta: PI * 0.35, phi: TAU * 2 / 3 }, type: 'crystal', height: 3, radius: 1.0 },
        { coord: { theta: PI * 0.65, phi: TAU / 6 }, type: 'crystal', height: 3, radius: 1.0 },
        { coord: { theta: PI * 0.65, phi: TAU * 3 / 6 }, type: 'crystal', height: 3, radius: 1.0 },
        { coord: { theta: PI * 0.65, phi: TAU * 5 / 6 }, type: 'crystal', height: 3, radius: 1.0 },
    ],
    enemySpawns: [
        { coord: { theta: PI * 0.1, phi: 0 } },
        { coord: { theta: PI * 0.1, phi: TAU * 0.5 } },
        { coord: { theta: PI * 0.9, phi: TAU * 0.25 } },
        { coord: { theta: PI * 0.9, phi: TAU * 0.75 } },
        { coord: { theta: PI * 0.5, phi: TAU * 0.125 } },
        { coord: { theta: PI * 0.5, phi: TAU * 0.625 } },
    ],
    playerSpawns: [
        { theta: PI * 0.45, phi: 0 },
        { theta: PI * 0.45, phi: TAU * 0.25 },
        { theta: PI * 0.55, phi: TAU * 0.5 },
        { theta: PI * 0.55, phi: TAU * 0.75 },
    ],
};

export const ALL_MAPS: MapConfig[] = [MAP_NEXUS, MAP_FRACTURE, MAP_CONVERGENCE];
