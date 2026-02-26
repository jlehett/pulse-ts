import {
    useComponent,
    Transform,
} from '@pulse-ts/core';
import { useRigidBody, useBoxCollider, useWaypointPatrol } from '@pulse-ts/physics';
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

    useWaypointPatrol(body, {
        waypoints: [props.position, props.target],
        speed,
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
