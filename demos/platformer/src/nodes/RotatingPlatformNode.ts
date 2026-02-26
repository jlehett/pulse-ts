import * as THREE from 'three';
import {
    useComponent,
    useFixedUpdate,
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
 * mesh rotation is slerp-interpolated between fixed steps by ThreeTRSSyncSystem,
 * which reads Transform.previousLocalRotation → localRotation each frame.
 */
export function RotatingPlatformNode(props: Readonly<RotatingPlatformNodeProps>) {
    const [sx, sy, sz] = props.size;
    const color = props.color ?? 0x7a4e8b;
    const angularSpeed = props.angularSpeed ?? 1.0;

    const transform = useComponent(Transform);
    transform.localPosition.set(...props.position);

    const body = useRigidBody({ type: 'kinematic' });
    useBoxCollider(sx / 2, sy / 2, sz / 2, { friction: 0.6, restitution: 0 });

    // Kinematic bodies control their own rotation directly. Expose angularVelocity
    // so the contact solver can compute correct rotational collision response.
    body.setAngularVelocity(0, angularSpeed, 0);

    const tmpQuat = new Quat();
    const tmpQuat2 = new Quat();
    useFixedUpdate((dt) => {
        const angle = angularSpeed * dt;
        const half = angle * 0.5;
        // Delta quaternion: rotation of `angle` radians around Y axis
        tmpQuat.set(0, Math.sin(half), 0, Math.cos(half));
        const cur = transform.localRotation;
        const updated = Quat.multiply(tmpQuat, cur, tmpQuat2);
        transform.localRotation.set(updated.x, updated.y, updated.z, updated.w);
    });

    // Three.js visual — rotation is slerp-interpolated automatically by ThreeTRSSyncSystem
    // (frame.late) using Transform interpolation, same as MovingPlatformNode.
    const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(sx, sy, sz),
        new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.3 }),
    );
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    useThreeRoot();
    useObject3D(mesh);
}
