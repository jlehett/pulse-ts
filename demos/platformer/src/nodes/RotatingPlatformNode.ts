import * as THREE from 'three';
import {
    useComponent,
    useFixedEarly,
    useFixedUpdate,
    useFrameUpdate,
    useWorld,
    Transform,
    Quat,
} from '@pulse-ts/core';
import { useRigidBody, useBoxCollider } from '@pulse-ts/physics';
import { useThreeRoot, useObject3D } from '@pulse-ts/three';

export interface RotatingPlatformNodeProps {
    position: [number, number, number];
    size: [number, number, number];
    color?: number;
    /** Angular speed in radians/second around the Y axis. Default: 1.0. */
    angularSpeed?: number;
}

/**
 * A kinematic platform that spins continuously around its Y axis. The Three.js
 * mesh rotation is slerp-interpolated between fixed steps for smooth visuals.
 */
export function RotatingPlatformNode(props: Readonly<RotatingPlatformNodeProps>) {
    const [sx, sy, sz] = props.size;
    const color = props.color ?? 0x7a4e8b;
    const angularSpeed = props.angularSpeed ?? 1.0;

    const transform = useComponent(Transform);
    transform.localPosition.set(...props.position);

    const body = useRigidBody({ type: 'kinematic' });
    useBoxCollider(sx / 2, sy / 2, sz / 2, { friction: 0.6, restitution: 0 });

    const world = useWorld();

    // Drive rotation by setting angularVelocity around Y each step.
    useFixedUpdate(() => {
        body.setAngularVelocity(0, angularSpeed, 0);
    });

    // Pre-step rotation snapshot for interpolation.
    const prevRot = new Quat(0, 0, 0, 1);
    const interpRot = new Quat(0, 0, 0, 1);

    useFixedEarly(() => {
        const r = transform.localRotation;
        prevRot.set(r.x, r.y, r.z, r.w);
    });

    // Three.js visual
    const root = useThreeRoot();
    const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(sx, sy, sz),
        new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.3 }),
    );
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    useObject3D(mesh);

    // Interpolate mesh rotation between fixed steps.
    useFrameUpdate(() => {
        const alpha = world.getAmbientAlpha();
        const cur = transform.localRotation;
        Quat.slerpInto(prevRot, cur, alpha, interpRot);
        root.quaternion.set(interpRot.x, interpRot.y, interpRot.z, interpRot.w);
    });
}
