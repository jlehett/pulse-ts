import * as THREE from 'three';
import {
    useComponent,
    useFixedEarly,
    useFixedUpdate,
    useFrameUpdate,
    useWorld,
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
 * points. The Three.js mesh is physics-interpolated so movement is smooth at
 * any frame rate.
 */
export function MovingPlatformNode(props: Readonly<MovingPlatformNodeProps>) {
    const [sx, sy, sz] = props.size;
    const color = props.color ?? 0x2e8b7a;
    const speed = props.speed ?? 3;

    const transform = useComponent(Transform);
    transform.localPosition.set(...props.position);

    const body = useRigidBody({ type: 'kinematic' });
    useBoxCollider(sx / 2, sy / 2, sz / 2, { friction: 0.6, restitution: 0 });

    const world = useWorld();

    const [ax, ay, az] = props.position;
    const [bx, by, bz] = props.target;

    // Direction: true = travelling toward target, false = returning to origin.
    let towardTarget = true;

    // Pre-step position for frame interpolation (same pattern as PlayerNode).
    let prevX = ax, prevY = ay, prevZ = az;

    useFixedEarly(() => {
        prevX = transform.localPosition.x;
        prevY = transform.localPosition.y;
        prevZ = transform.localPosition.z;
    });

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
    });

    // Three.js visual
    const root = useThreeRoot();
    const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(sx, sy, sz),
        new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.2 }),
    );
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    useObject3D(mesh);

    // Interpolate mesh position between fixed steps for smooth visuals.
    useFrameUpdate(() => {
        const alpha = world.getAmbientAlpha();
        const cur = transform.localPosition;
        root.position.set(
            prevX + (cur.x - prevX) * alpha,
            prevY + (cur.y - prevY) * alpha,
            prevZ + (cur.z - prevZ) * alpha,
        );
    });
}
