/**
 * Spherical coordinates for placing things on the planetoid surface.
 * theta = polar angle from north pole (0 = top, PI = bottom)
 * phi = azimuthal angle around the equator (0 to 2PI)
 */
export interface SphereCoord {
    theta: number;
    phi: number;
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

const PI = Math.PI;
const TAU = PI * 2;

export const MAP_CONVERGENCE: MapConfig = {
    id: 'convergence',
    name: 'Convergence',
    sphereRadius: 15,
    surfaceColor: 0x0e0e11,
    emissiveColor: 0x334455,
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

export const DEFAULT_MAP = MAP_CONVERGENCE;
