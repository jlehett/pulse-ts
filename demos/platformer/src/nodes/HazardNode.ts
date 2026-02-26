import {
    useComponent,
    useFrameUpdate,
    getComponent,
    Transform,
    useContext,
} from '@pulse-ts/core';
import { useRigidBody, useBoxCollider, useOnCollisionStart, RigidBody } from '@pulse-ts/physics';
import { useMesh } from '@pulse-ts/three';
import { PlayerTag } from '../components/PlayerTag';
import { playDeath } from '../utils/audio';
import { RespawnCtx, PlayerNodeCtx } from '../contexts';

const DEFAULT_COLOR = 0xcc3300;
const EMISSIVE_COLOR = 0xff4400;
const PULSE_SPEED = 3.0;
const PULSE_MIN = 0.4;
const PULSE_MAX = 0.9;

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
        emissiveIntensity: PULSE_MIN,
        roughness: 0.6,
        metalness: 0.2,
        castShadow: true,
        receiveShadow: true,
    });

    root.position.set(...props.position);

    // Subtle pulsing emissive
    let elapsed = 0;
    useFrameUpdate((dt) => {
        elapsed += dt;
        const t = (Math.sin(elapsed * PULSE_SPEED) + 1) / 2; // 0–1
        material.emissiveIntensity = PULSE_MIN + t * (PULSE_MAX - PULSE_MIN);
    });

    // Respawn player on contact
    useOnCollisionStart(({ other }) => {
        if (!getComponent(other, PlayerTag)) return;
        playDeath();

        const playerTransform = getComponent(playerNode, Transform);
        const playerBody = getComponent(playerNode, RigidBody);
        if (!playerTransform || !playerBody) return;

        playerTransform.localPosition.set(...respawnState.position);
        playerBody.setLinearVelocity(0, 0, 0);
    });
}
