import * as THREE from 'three';
import { useComponent, Transform } from '@pulse-ts/core';
import { useRigidBody, useBoxCollider } from '@pulse-ts/physics';
import { useThreeRoot, useObject3D } from '@pulse-ts/three';

export interface PlatformNodeProps {
    position: [number, number, number];
    size: [number, number, number];
    color?: number;
}

export function PlatformNode(props: Readonly<PlatformNodeProps>) {
    const [sx, sy, sz] = props.size;
    const color = props.color ?? 0x4a6670;

    const transform = useComponent(Transform);
    transform.localPosition.set(...props.position);

    useRigidBody({ type: 'static' });
    useBoxCollider(sx / 2, sy / 2, sz / 2, {
        friction: 0.6,
        restitution: 0,
    });

    // Three.js visual
    const root = useThreeRoot();
    const geometry = new THREE.BoxGeometry(sx, sy, sz);
    const material = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.8,
        metalness: 0.1,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    useObject3D(mesh);
}
