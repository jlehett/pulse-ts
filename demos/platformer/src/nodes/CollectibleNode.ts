import * as THREE from 'three';
import {
    useComponent,
    useNode,
    useFrameUpdate,
    Transform,
} from '@pulse-ts/core';
import { useRigidBody, useSphereCollider, useOnCollisionStart } from '@pulse-ts/physics';
import { useThreeRoot, useObject3D } from '@pulse-ts/three';

const COLLECTIBLE_RADIUS = 0.25;
const SPIN_SPEED = 2;
const BOB_SPEED = 2;
const BOB_AMPLITUDE = 0.2;

export interface CollectibleNodeProps {
    position: [number, number, number];
}

export function CollectibleNode(props: Readonly<CollectibleNodeProps>) {
    const node = useNode();

    const transform = useComponent(Transform);
    transform.localPosition.set(...props.position);

    useRigidBody({ type: 'static' });
    useSphereCollider(COLLECTIBLE_RADIUS, { isTrigger: true });

    // Three.js visual — icosahedron for a gem-like look
    const root = useThreeRoot();
    const geometry = new THREE.IcosahedronGeometry(COLLECTIBLE_RADIUS, 0);
    const material = new THREE.MeshStandardMaterial({
        color: 0xf4d03f,
        roughness: 0.3,
        metalness: 0.6,
        emissive: 0xf4d03f,
        emissiveIntensity: 0.3,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    useObject3D(mesh);

    const baseY = props.position[1];
    let elapsed = 0;

    // Spin and bob animation
    useFrameUpdate((dt) => {
        elapsed += dt;
        mesh.rotation.y += SPIN_SPEED * dt;
        root.position.set(
            transform.localPosition.x,
            baseY + Math.sin(elapsed * BOB_SPEED) * BOB_AMPLITUDE,
            transform.localPosition.z,
        );
    });

    // Destroy on contact with any other node (player)
    useOnCollisionStart(() => {
        node.destroy();
    });
}
