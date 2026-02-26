import {
    useComponent,
    useFrameUpdate,
    getComponent,
    Transform,
    useContext,
} from '@pulse-ts/core';
import { useRigidBody, useBoxCollider, useOnCollisionStart, RigidBody } from '@pulse-ts/physics';
import { useMesh } from '@pulse-ts/three';
import { useSound } from '@pulse-ts/audio';
import { useAnimate } from '@pulse-ts/effects';
import { PlayerTag } from '../components/PlayerTag';
import { RespawnCtx, PlayerNodeCtx } from '../contexts';

const DEFAULT_COLOR = 0xcc3300;
const EMISSIVE_COLOR = 0xff4400;

export interface HazardNodeProps {
    position: [number, number, number];
    size: [number, number, number];
    color?: number;
}

/**
 * Hazard platform that kills the player on contact, respawning them at the
 * latest checkpoint (or level spawn).
 *
 * Renders a box with a pulsing red/orange emissive glow. On player collision,
 * teleports the player to `respawnState.position` and zeros their velocity.
 *
 * @param props - Hazard position, size, and optional color override.
 *
 * @example
 * ```ts
 * import { useChild } from '@pulse-ts/core';
 * import { HazardNode } from './HazardNode';
 *
 * useChild(HazardNode, {
 *     position: [10, 0.2, 0],
 *     size: [2, 0.15, 3],
 * });
 * ```
 */
export function HazardNode(props: Readonly<HazardNodeProps>) {
    const respawnState = useContext(RespawnCtx);
    const playerNode = useContext(PlayerNodeCtx);
    const transform = useComponent(Transform);
    transform.localPosition.set(...props.position);

    useRigidBody({ type: 'static' });
    const [hx, hy, hz] = props.size.map((s) => s / 2) as [number, number, number];
    useBoxCollider(hx, hy, hz, { isTrigger: true });

    // Visual — box with pulsing emissive
    const color = props.color ?? DEFAULT_COLOR;
    const { root, material } = useMesh('box', {
        size: props.size,
        color,
        emissive: EMISSIVE_COLOR,
        emissiveIntensity: 0.4,
        roughness: 0.6,
        metalness: 0.2,
        castShadow: true,
        receiveShadow: true,
    });

    root.position.set(...props.position);

    const deathSfx = useSound('tone', {
        wave: 'sawtooth',
        frequency: [600, 150],
        duration: 0.2,
        gain: 0.12,
    });

    // Subtle pulsing emissive
    const pulse = useAnimate({ wave: 'sine', min: 0.4, max: 0.9, frequency: 3 });
    useFrameUpdate(() => {
        material.emissiveIntensity = pulse.value;
    });

    // Respawn player on contact
    useOnCollisionStart(({ other }) => {
        if (!getComponent(other, PlayerTag)) return;
        deathSfx.play();

        const playerTransform = getComponent(playerNode, Transform);
        const playerBody = getComponent(playerNode, RigidBody);
        if (!playerTransform || !playerBody) return;

        playerTransform.localPosition.set(...respawnState.position);
        playerBody.setLinearVelocity(0, 0, 0);
    });
}
