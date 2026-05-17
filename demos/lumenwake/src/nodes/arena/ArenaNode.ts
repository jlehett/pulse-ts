import { useChild } from '@pulse-ts/core';
import { usePointLight } from '@pulse-ts/three';
import type { MapConfig } from '../../config/maps';
import { GridFloorNode } from './GridFloorNode';
import { DarknessEdgeNode } from './DarknessEdgeNode';
import { ObstacleNode } from './ObstacleNode';

export interface ArenaNodeProps {
    map: MapConfig;
}

/**
 * Top-level arena scene node. Composes the grid floor, darkness edge,
 * obstacles, and ambient lighting for a given map configuration.
 */
export function ArenaNode(props: ArenaNodeProps) {
    const { map } = props;

    const floor = useChild(GridFloorNode, { map });
    const darknessEdge = useChild(DarknessEdgeNode, { map });

    for (const obstacle of map.obstacles) {
        useChild(ObstacleNode, obstacle);
    }

    usePointLight({
        color: 0x4488ff,
        intensity: 2.0,
        distance: 40,
        position: [0, 10, 0],
    });

    return {
        floor,
        darknessEdge,
    };
}
