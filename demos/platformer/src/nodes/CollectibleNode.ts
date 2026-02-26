import * as THREE from 'three';
import {
    useComponent,
    useNode,
    useWorld,
    useFrameUpdate,
    getComponent,
    Transform,
} from '@pulse-ts/core';
import { useRigidBody, useSphereCollider, useOnCollisionStart } from '@pulse-ts/physics';
import { PlayerTag } from '../components/PlayerTag';
import { useThreeRoot, useObject3D } from '@pulse-ts/three';
import { ParticleBurstNode } from './ParticleBurstNode';
import { playCollect } from '../utils/audio';

const COLLECTIBLE_RADIUS = 0.25;
const SPIN_SPEED = 2;
const BOB_SPEED = 2;
const BOB_AMPLITUDE = 0.2;

/** Shared mutable counter incremented each time a collectible is picked up. */
export interface CollectibleState {
    collected: number;
}

export interface CollectibleNodeProps {
    position: [number, number, number];
    collectibleState: CollectibleState;
}

export function CollectibleNode(props: Readonly<CollectibleNodeProps>) {
    const node = useNode();
    const world = useWorld();

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

    // Increment counter and destroy on player contact only
    useOnCollisionStart(({ other }) => {
        if (!getComponent(other, PlayerTag)) return;
        playCollect();
        props.collectibleState.collected++;
        world.mount(ParticleBurstNode, {
            position: [
                transform.localPosition.x,
                transform.localPosition.y,
                transform.localPosition.z,
            ],
        });
        node.destroy();
    });
}
