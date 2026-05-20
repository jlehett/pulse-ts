import * as THREE from 'three';
import { useFrameUpdate, useWorld, useNode } from '@pulse-ts/core';
import { useMesh } from '@pulse-ts/three';
import { moveSpherePosition } from '../../utils/sphereMovement';

const MAX_LIFETIME = 2.0;

export interface ProjectileProps {
    origin: THREE.Vector3;
    direction: THREE.Vector3;
    speed: number;
    damage: number;
    color: number;
    sphereRadius: number;
    meshRadius?: number;
    emissiveIntensity?: number;
    onPositionUpdate?: (position: THREE.Vector3) => void;
    onExpired?: () => void;
}

/**
 * A light projectile that travels along a great-circle arc on the sphere surface.
 * Self-destructs after MAX_LIFETIME seconds.
 */
export function ProjectileNode(props: ProjectileProps) {
    const { origin, direction, speed, color, sphereRadius } = props;
    const meshRadius = props.meshRadius ?? 0.15;
    const baseEmissive = props.emissiveIntensity ?? 2.0;

    const world = useWorld();
    const node = useNode();

    const { root, mesh, material } = useMesh('sphere', {
        radius: meshRadius,
        color,
        emissive: color,
        emissiveIntensity: baseEmissive,
        roughness: 0,
        metalness: 1,
    });

    (material as THREE.MeshStandardMaterial).toneMapped = false;

    const position = origin.clone();
    const velocity = direction.clone().normalize().multiplyScalar(speed);
    let lifetime = 0;
    let destroyed = false;

    // Initial position above surface
    root.position.copy(position);
    const initNormal = position.clone().normalize();
    root.position.addScaledVector(initNormal, 0.6);

    useFrameUpdate((dt) => {
        if (destroyed) return;

        lifetime += dt;

        if (lifetime >= MAX_LIFETIME) {
            destroyed = true;
            props.onExpired?.();
            world.remove(node);
            return;
        }

        // Move along sphere surface
        moveSpherePosition(position, velocity, dt, sphereRadius);

        // Re-project velocity to tangent plane (stay on surface)
        const n = position.clone().normalize();
        const dot = velocity.dot(n);
        velocity.sub(n.multiplyScalar(dot));
        velocity.normalize().multiplyScalar(speed);

        // Update visual position (slightly above surface)
        root.position.copy(position);
        const surfaceNormal = position.clone().normalize();
        root.position.addScaledVector(surfaceNormal, 0.6);

        // Report position for lighting
        props.onPositionUpdate?.(position);

        // Animated glow — gentle pulse
        const flicker =
            1.0 +
            0.15 * Math.sin(lifetime * 12) +
            0.1 * Math.sin(lifetime * 19);
        const sizePulse = 1.0 + 0.08 * Math.sin(lifetime * 10);
        mesh.scale.setScalar(sizePulse);

        // Fade out near end of life
        const fadeStart = MAX_LIFETIME * 0.7;
        const fade =
            lifetime > fadeStart
                ? 1 - (lifetime - fadeStart) / (MAX_LIFETIME - fadeStart)
                : 1.0;
        (material as THREE.MeshStandardMaterial).emissiveIntensity =
            baseEmissive * fade * flicker;
    });

    return {
        position,
        damage: props.damage,
        get alive() {
            return !destroyed;
        },
        destroy() {
            if (destroyed) return;
            destroyed = true;
            world.remove(node);
        },
    };
}
