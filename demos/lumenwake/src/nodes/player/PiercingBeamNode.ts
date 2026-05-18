import * as THREE from 'three';
import { useFrameUpdate, useWorld, useNode } from '@pulse-ts/core';
import { useMesh } from '@pulse-ts/three';
import {
    moveSpherePosition,
    projectToTangent,
} from '../../utils/sphereMovement';

const MAX_LIFETIME = 3.0;
const BEAM_LENGTH = 2.0;
const BEAM_RADIUS = 0.08;

export interface PiercingBeamProps {
    origin: THREE.Vector3;
    direction: THREE.Vector3;
    speed: number;
    damage: number;
    color: number;
    sphereRadius: number;
    onPositionUpdate?: (position: THREE.Vector3) => void;
}

/**
 * A piercing beam projectile — elongated, fast, passes through targets.
 * Travels along a great-circle arc on the sphere surface.
 */
export function PiercingBeamNode(props: PiercingBeamProps) {
    const { origin, direction, speed, color, sphereRadius } = props;

    const world = useWorld();
    const node = useNode();

    const { root, material } = useMesh('cylinder', {
        radius: BEAM_RADIUS,
        height: BEAM_LENGTH,
        radialSegments: 6,
        color,
        emissive: color,
        emissiveIntensity: 3.0,
        roughness: 0,
        metalness: 1,
        transparent: true,
        opacity: 0.9,
    });

    (material as THREE.MeshStandardMaterial).toneMapped = false;

    const position = origin.clone();
    const velocity = direction.clone().normalize().multiplyScalar(speed);
    let lifetime = 0;
    let destroyed = false;

    root.position.copy(position);

    useFrameUpdate((dt) => {
        if (destroyed) return;

        lifetime += dt;

        if (lifetime >= MAX_LIFETIME) {
            destroyed = true;
            world.remove(node);
            return;
        }

        moveSpherePosition(position, velocity, dt, sphereRadius);

        // Re-project velocity to tangent plane
        const n = position.clone().normalize();
        const dot = velocity.dot(n);
        velocity.sub(n.multiplyScalar(dot));
        velocity.normalize().multiplyScalar(speed);

        // Position above surface
        root.position.copy(position);
        const surfaceNormal = position.clone().normalize();
        root.position.addScaledVector(surfaceNormal, 0.6);

        // Orient beam along travel direction (cylinder Y-axis → velocity direction)
        const tangentDir = velocity.clone().normalize();
        projectToTangent(tangentDir, position);
        tangentDir.normalize();
        const up = surfaceNormal;
        const right = new THREE.Vector3()
            .crossVectors(tangentDir, up)
            .normalize();
        const correctedForward = new THREE.Vector3()
            .crossVectors(up, right)
            .normalize();
        const m = new THREE.Matrix4().makeBasis(right, correctedForward, up);
        root.quaternion.setFromRotationMatrix(m);

        props.onPositionUpdate?.(position);

        // Fade out near end of life
        const fadeStart = MAX_LIFETIME * 0.75;
        if (lifetime > fadeStart) {
            const fade =
                1 - (lifetime - fadeStart) / (MAX_LIFETIME - fadeStart);
            (material as THREE.MeshStandardMaterial).emissiveIntensity =
                3.0 * fade;
            (material as THREE.MeshStandardMaterial).opacity = 0.9 * fade;
        }
    });

    return { position, damage: props.damage, piercing: true };
}
