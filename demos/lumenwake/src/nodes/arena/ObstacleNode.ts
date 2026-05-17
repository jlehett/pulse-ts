import { useMesh } from '@pulse-ts/three';
import { useFrameUpdate } from '@pulse-ts/core';
import type { ObstacleConfig } from '../../config/maps';

/**
 * A single obstacle (crystal pillar or wall) rendered as emissive geometry.
 */
export function ObstacleNode(config: ObstacleConfig) {
    if (config.type === 'pillar') {
        const height = config.height ?? 3;
        const radius = config.radius ?? 0.8;

        const { root, mesh } = useMesh('cylinder', {
            radius,
            height,
            radialSegments: 6,
            color: 0x1a1a3a,
            emissive: 0x3355aa,
            emissiveIntensity: 0.6,
            roughness: 0.3,
            metalness: 0.7,
        });

        root.position.set(config.position[0], height / 2, config.position[1]);

        useFrameUpdate((_, elapsed) => {
            mesh.rotation.y = elapsed * 0.2;
            const pulse = Math.sin(elapsed * 1.5 + config.position[0]) * 0.1 + 0.6;
            (mesh.material as any).emissiveIntensity = pulse;
        });
    } else {
        const width = config.width ?? 3;
        const depth = config.depth ?? 0.4;
        const height = config.height ?? 2.5;

        const { root, mesh } = useMesh('box', {
            size: [width, height, depth],
            color: 0x1a1a3a,
            emissive: 0x3355aa,
            emissiveIntensity: 0.5,
            roughness: 0.3,
            metalness: 0.7,
        });

        root.position.set(config.position[0], height / 2, config.position[1]);

        useFrameUpdate((_, elapsed) => {
            const pulse = Math.sin(elapsed * 1.2 + config.position[1]) * 0.1 + 0.5;
            (mesh.material as any).emissiveIntensity = pulse;
        });
    }
}
