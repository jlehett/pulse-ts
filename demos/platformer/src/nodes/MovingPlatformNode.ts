import {
    useComponent,
    useFixedUpdate,
    Transform,
} from '@pulse-ts/core';
import { useRigidBody, useBoxCollider } from '@pulse-ts/physics';
import { useMesh } from '@pulse-ts/three';

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
 * points. Linear velocity is set each step toward the current waypoint;
 * integrateTransforms handles position integration.
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

    useFixedUpdate((dt) => {
        const pos = transform.localPosition;
        const tx = towardTarget ? bx : ax;
        const ty = towardTarget ? by : ay;
        const tz = towardTarget ? bz : az;
        const dx = tx - pos.x, dy = ty - pos.y, dz = tz - pos.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        // Reverse when close enough to the waypoint.
        if (dist <= speed * dt) towardTarget = !towardTarget;

        // Set velocity toward the current waypoint (recomputed after any flip).
        const wx = towardTarget ? bx : ax;
        const wy = towardTarget ? by : ay;
        const wz = towardTarget ? bz : az;
        const wdx = wx - pos.x, wdy = wy - pos.y, wdz = wz - pos.z;
        const wdist = Math.sqrt(wdx * wdx + wdy * wdy + wdz * wdz);
        if (wdist > 1e-6) {
            const inv = 1 / wdist;
            body.setLinearVelocity(wdx * inv * speed, wdy * inv * speed, wdz * inv * speed);
        }
    });

    useMesh('box', {
        size: [sx, sy, sz],
        color,
        roughness: 0.7,
        metalness: 0.2,
        castShadow: true,
        receiveShadow: true,
    });
}
