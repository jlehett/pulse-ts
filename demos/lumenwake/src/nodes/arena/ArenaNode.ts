import { usePointLight } from '@pulse-ts/three';
import type { MapConfig } from '../../config/maps';
import { PlanetoidNode } from './PlanetoidNode';

export interface ArenaNodeProps {
    map: MapConfig;
}

/**
 * Top-level arena node. Composes the planetoid sphere
 * and ambient lighting.
 */
export function ArenaNode(props: ArenaNodeProps) {
    const { map } = props;

    const planetoid = PlanetoidNode({ map });

    // Key light from above
    usePointLight({
        color: 0x6688ff,
        intensity: 3.0,
        distance: map.sphereRadius * 4,
        position: [0, map.sphereRadius * 2, 0],
    });

    // Fill light from below
    usePointLight({
        color: 0x223344,
        intensity: 1.0,
        distance: map.sphereRadius * 3,
        position: [0, -map.sphereRadius * 1.5, 0],
    });

    return { planetoid };
}
