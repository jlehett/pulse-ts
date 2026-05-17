import * as THREE from 'three';
import { useMesh } from '@pulse-ts/three';
import { useFrameUpdate } from '@pulse-ts/core';
import { sphereToWorld, sphereNormal, type ObstacleConfig } from '../../config/maps';

/**
 * A single obstacle placed on the planetoid surface.
 * Oriented outward along the surface normal at its coordinate.
 */
export function ObstacleNode(
    config: ObstacleConfig & { sphereRadius: number },
) {
    const height = config.height ?? 2;
    const radius = config.radius ?? 0.6;
    const surfacePos = sphereToWorld(config.coord, config.sphereRadius);
    const normal = sphereNormal(config.coord);

    let mesh: THREE.Mesh;
    let root: THREE.Object3D;

    if (config.type === 'pillar') {
        const result = useMesh('cylinder', {
            radius,
            height,
            radialSegments: 6,
            color: 0x1a1a3a,
            emissive: 0x3355aa,
            emissiveIntensity: 0.6,
            roughness: 0.3,
            metalness: 0.7,
        });
        mesh = result.mesh;
        root = result.root;
    } else if (config.type === 'crystal') {
        const result = useMesh('octahedron', {
            radius: radius * 1.2,
            color: 0x1a2a3a,
            emissive: 0x4488cc,
            emissiveIntensity: 0.8,
            roughness: 0.2,
            metalness: 0.8,
        });
        mesh = result.mesh;
        root = result.root;
    } else {
        const w = config.width ?? 3;
        const result = useMesh('box', {
            size: [w, height, 0.4],
            color: 0x1a1a3a,
            emissive: 0x3355aa,
            emissiveIntensity: 0.5,
            roughness: 0.3,
            metalness: 0.7,
        });
        mesh = result.mesh;
        root = result.root;
    }

    // Position on sphere surface, offset by half height along normal
    const offset = height * 0.5;
    root.position.set(
        surfacePos[0] + normal[0] * offset,
        surfacePos[1] + normal[1] * offset,
        surfacePos[2] + normal[2] * offset,
    );

    // Orient so "up" aligns with surface normal
    const up = new THREE.Vector3(normal[0], normal[1], normal[2]);
    const target = new THREE.Vector3(
        surfacePos[0] + normal[0] * 10,
        surfacePos[1] + normal[1] * 10,
        surfacePos[2] + normal[2] * 10,
    );
    root.lookAt(target);
    root.rotateX(Math.PI / 2);

    useFrameUpdate((_, elapsed) => {
        const pulse =
            Math.sin(elapsed * 1.5 + config.coord.phi * 3) * 0.15 + 0.65;
        (mesh.material as any).emissiveIntensity = pulse;
        if (config.type === 'crystal') {
            mesh.rotation.y = elapsed * 0.5;
        }
    });
}
