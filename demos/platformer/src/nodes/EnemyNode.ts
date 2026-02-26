import {
    useComponent,
    useFrameUpdate,
    useNode,
    useWorld,
    getComponent,
    Transform,
    useContext,
} from '@pulse-ts/core';
import { useRigidBody, useBoxCollider, useOnCollisionStart, useWaypointPatrol, RigidBody } from '@pulse-ts/physics';
import { useMesh } from '@pulse-ts/three';
import { useSound } from '@pulse-ts/audio';
import { PlayerTag } from '../components/PlayerTag';
import { ParticleBurstNode } from './ParticleBurstNode';
import { RespawnCtx, PlayerNodeCtx } from '../contexts';

const DEFAULT_COLOR = 0x8b1a1a;
const EMISSIVE_COLOR = 0xcc2200;
const PULSE_SPEED = 4.0;
const PULSE_MIN = 0.3;
const PULSE_MAX = 0.8;

/** Player must be falling at least this fast (negative Y velocity) for a stomp. */
export const STOMP_VELOCITY_THRESHOLD = -1.5;

/** Player Y must be above enemy Y + (enemy height * this fraction) to count as a stomp. */
export const STOMP_Y_OFFSET = 0.3;

/** Upward speed applied to the player after a successful stomp. */
export const STOMP_BOUNCE_SPEED = 8;

/** Color of the particle burst when an enemy is stomped. */
export const STOMP_PARTICLE_COLOR = 0xcc2200;

export interface EnemyNodeProps {
    position: [number, number, number];
    /** World-space destination; enemy patrols between position and target. */
    target: [number, number, number];
    size: [number, number, number];
    color?: number;
    /** Patrol speed in world units/second. Default: 2. */
    speed?: number;
}

/**
 * Patrolling enemy that oscillates between two waypoints and kills the player
 * on contact. Uses a kinematic rigid body with a trigger collider so contact
 * means instant death (no push/bounce physics).
 *
 * Renders a dark red box with a pulsing emissive glow to distinguish it from
 * hazard platforms and static geometry.
 *
 * @param props - Enemy position, target, size, color override, and speed.
 *
 * @example
 * ```ts
 * import { useChild } from '@pulse-ts/core';
 * import { EnemyNode } from './EnemyNode';
 *
 * useChild(EnemyNode, {
 *     position: [7, 1.4, -1],
 *     target: [7, 1.4, 1],
 *     size: [0.6, 0.8, 0.6],
 *     speed: 1.5,
 * });
 * ```
 */
export function EnemyNode(props: Readonly<EnemyNodeProps>) {
    const respawnState = useContext(RespawnCtx);
    const playerNode = useContext(PlayerNodeCtx);
    const [sx, sy, sz] = props.size;
    const color = props.color ?? DEFAULT_COLOR;
    const speed = props.speed ?? 2;

    const transform = useComponent(Transform);
    transform.localPosition.set(...props.position);

    const body = useRigidBody({ type: 'kinematic' });
    useBoxCollider(sx / 2, sy / 2, sz / 2, { isTrigger: true });

    useWaypointPatrol(body, {
        waypoints: [props.position, props.target],
        speed,
    });

    // Visual — dark red box with pulsing emissive
    const { material } = useMesh('box', {
        size: [sx, sy, sz],
        color,
        emissive: EMISSIVE_COLOR,
        emissiveIntensity: PULSE_MIN,
        roughness: 0.6,
        metalness: 0.2,
        castShadow: true,
        receiveShadow: true,
    });

    // Subtle pulsing emissive
    let elapsed = 0;
    useFrameUpdate((dt) => {
        elapsed += dt;
        const t = (Math.sin(elapsed * PULSE_SPEED) + 1) / 2; // 0–1
        material.emissiveIntensity = PULSE_MIN + t * (PULSE_MAX - PULSE_MIN);
    });

    const node = useNode();
    const world = useWorld();

    const deathSfx = useSound('tone', {
        wave: 'sawtooth',
        frequency: [600, 150],
        duration: 0.2,
        gain: 0.12,
    });

    // Stomp from above kills enemy; side/bottom contact kills player
    useOnCollisionStart(({ other }) => {
        if (!getComponent(other, PlayerTag)) return;

        const playerTransform = getComponent(playerNode, Transform);
        const playerBody = getComponent(playerNode, RigidBody);
        if (!playerTransform || !playerBody) return;

        const playerVelY = playerBody.linearVelocity.y;
        const playerY = playerTransform.localPosition.y;
        const enemyY = transform.localPosition.y;

        const isStomp =
            playerVelY < STOMP_VELOCITY_THRESHOLD &&
            playerY > enemyY + sy * STOMP_Y_OFFSET;

        if (isStomp) {
            deathSfx.play();
            // Spawn red particle burst at enemy position
            world.mount(ParticleBurstNode, {
                position: [
                    transform.localPosition.x,
                    transform.localPosition.y,
                    transform.localPosition.z,
                ],
                color: STOMP_PARTICLE_COLOR,
            });

            // Bounce the player upward
            playerBody.setLinearVelocity(
                playerBody.linearVelocity.x,
                STOMP_BOUNCE_SPEED,
                playerBody.linearVelocity.z,
            );

            node.destroy();
        } else {
            // Side/bottom contact — respawn the player
            deathSfx.play();
            playerTransform.localPosition.set(...respawnState.position);
            playerBody.setLinearVelocity(0, 0, 0);
        }
    });
}
