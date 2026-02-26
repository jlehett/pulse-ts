import {
    useComponent,
    useNode,
    useFrameUpdate,
    getComponent,
    Transform,
    useContext,
} from '@pulse-ts/core';
import { useRigidBody, useSphereCollider, useOnCollisionStart } from '@pulse-ts/physics';
import { PlayerTag } from '../components/PlayerTag';
import { useMesh } from '@pulse-ts/three';
import { useSound } from '@pulse-ts/audio';
import { useAnimate } from '@pulse-ts/effects';
import { CollectibleCtx, ParticleEffectsCtx } from '../contexts';

const COLLECTIBLE_RADIUS = 0.25;

/** Shared mutable counter incremented each time a collectible is picked up. */
export interface CollectibleState {
    collected: number;
}

export interface CollectibleNodeProps {
    position: [number, number, number];
}

export function CollectibleNode(props: Readonly<CollectibleNodeProps>) {
    const node = useNode();
    const collectibleState = useContext(CollectibleCtx);
    const fx = useContext(ParticleEffectsCtx);

    const transform = useComponent(Transform);
    transform.localPosition.set(...props.position);

    useRigidBody({ type: 'static' });
    useSphereCollider(COLLECTIBLE_RADIUS, { isTrigger: true });

    // Three.js visual — icosahedron for a gem-like look
    const { root, mesh } = useMesh('icosahedron', {
        radius: COLLECTIBLE_RADIUS,
        detail: 0,
        color: 0xf4d03f,
        roughness: 0.3,
        metalness: 0.6,
        emissive: 0xf4d03f,
        emissiveIntensity: 0.3,
        castShadow: true,
    });

    const collectSfx = useSound('arpeggio', {
        wave: 'sine',
        notes: [523.25, 659.25, 783.99],
        interval: 0.06,
        duration: 0.2,
        gain: 0.1,
    });

    const baseY = props.position[1];
    const spin = useAnimate({ rate: 2 });
    const bob = useAnimate({ wave: 'sine', amplitude: 0.2, frequency: 2 });

    // Spin and bob animation
    useFrameUpdate(() => {
        mesh.rotation.y = spin.value;
        root.position.set(
            transform.localPosition.x,
            baseY + bob.value,
            transform.localPosition.z,
        );
    });

    // Increment counter and destroy on player contact only
    useOnCollisionStart(({ other }) => {
        if (!getComponent(other, PlayerTag)) return;
        collectSfx.play();
        collectibleState.collected++;
        fx.burst(24, [
            transform.localPosition.x,
            transform.localPosition.y,
            transform.localPosition.z,
        ]);
        node.destroy();
    });
}
