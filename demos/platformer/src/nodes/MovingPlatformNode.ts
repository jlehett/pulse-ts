import * as THREE from 'three';
import {
    useComponent,
    useFixedUpdate,
    Transform,
} from '@pulse-ts/core';
import { useRigidBody, useBoxCollider } from '@pulse-ts/physics';
import { useThreeRoot, useObject3D } from '@pulse-ts/three';

export interface MovingPlatformNodeProps {
    position: [number, number, number];
    /** World-space destination; platform oscillates between position and target. */
    target: [number, number, number];
    size: [number, number, number];
    color?: number;
    /** Travel speed in world units/second. Default: 3. */
    speed?: number;
}

/**
 * A kinematic platform that translates back and forth between two world-space
 * points. The Three.js mesh position is synced by ThreeTRSSyncSystem, which
 * interpolates Transform.previousLocalPosition → localPosition each frame.
 */
export function MovingPlatformNode(props: Readonly<MovingPlatformNodeProps>) {
    const [sx, sy, sz] = props.size;
    const color = props.color ?? 0x2e8b7a;
    const speed = props.speed ?? 3;

    const transform = useComponent(Transform);
    transform.localPosition.set(...props.position);

    const body = useRigidBody({ type: 'kinematic' });
    useBoxCollider(sx / 2, sy / 2, sz / 2, { friction: 0.6, restitution: 0 });

    const [ax, ay, az] = props.position;
    const [bx, by, bz] = props.target;

    // Direction: true = travelling toward target, false = returning to origin.
    let towardTarget = true;

    // Run at order -1 so velocity is set before PhysicsSystem (order 0) integrates.
    useFixedUpdate((dt) => {
        const pos = transform.localPosition;
        const tx = towardTarget ? bx : ax;
        const ty = towardTarget ? by : ay;
        const tz = towardTarget ? bz : az;

        const dx = tx - pos.x;
        const dy = ty - pos.y;
        const dz = tz - pos.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist <= speed * dt) {
            // Arrived — snap and reverse
            transform.localPosition.set(tx, ty, tz);
            body.setLinearVelocity(0, 0, 0);
            towardTarget = !towardTarget;
        } else {
            const inv = 1 / dist;
            body.setLinearVelocity(dx * inv * speed, dy * inv * speed, dz * inv * speed);
        }
    }, { order: -1 });

    // Three.js visual — position is synced automatically by ThreeTRSSyncSystem
    // (frame.late) using Transform interpolation, same as PlatformNode.
    const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(sx, sy, sz),
        new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.2 }),
    );
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    useThreeRoot();
    useObject3D(mesh);
}
