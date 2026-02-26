import {
    useComponent,
    Transform,
} from '@pulse-ts/core';
import { useRigidBody, useBoxCollider } from '@pulse-ts/physics';
import { useMesh } from '@pulse-ts/three';

export interface RotatingPlatformNodeProps {
    position: [number, number, number];
    size: [number, number, number];
    color?: number;
    /** Angular speed in radians/second around the Y axis. Default: 1.0. */
    angularSpeed?: number;
}

/**
 * A kinematic platform that spins continuously around its Y axis.
 * Angular velocity is set once on mount; ThreeTRSSyncSystem interpolates
 * the resulting rotation each frame.
 */
export function RotatingPlatformNode(props: Readonly<RotatingPlatformNodeProps>) {
    const [sx, sy, sz] = props.size;
    const color = props.color ?? 0x7a4e8b;
    const angularSpeed = props.angularSpeed ?? 1.0;

    const transform = useComponent(Transform);
    transform.localPosition.set(...props.position);

    const body = useRigidBody({ type: 'kinematic' });
    useBoxCollider(sx / 2, sy / 2, sz / 2, { friction: 0.6, restitution: 0 });

    // Set angular velocity once; integrateTransforms advances rotation each step.
    // The contact solver reads this velocity to compute rotational collision response.
    body.setAngularVelocity(0, angularSpeed, 0);

    useMesh('box', {
        size: [sx, sy, sz],
        color,
        roughness: 0.7,
        metalness: 0.3,
        castShadow: true,
        receiveShadow: true,
    });
}
