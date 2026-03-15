/**
 * Knockback handling — collision response, online velocity correction,
 * and bidirectional knockback channel for online mode.
 */

import {
    useNode,
    useComponent,
    getComponent,
    Transform,
    useCooldown,
    useFixedEarly,
} from '@pulse-ts/core';
import { useOnCollisionStart } from '@pulse-ts/physics';
import { useChannel } from '@pulse-ts/network';
import { PlayerTag } from '../components/PlayerTag';
import { triggerCameraShake } from './CameraRigNode';
import { markHit } from '../replay';
import { worldToScreen } from '../shockwave';
import { getPlayerVelocity } from '../playerVelocity';
import { computeKnockback, computeApproachSpeed } from './mechanics';
import type { DashState } from './dash';

/** Minimum knockback applied even when both players have zero closing speed. */
export const KNOCKBACK_BASE = 15;

/**
 * Knockback scaling factor per unit of the other player's approach speed.
 * Effective knockback: `KNOCKBACK_BASE + theirApproach * KNOCKBACK_VELOCITY_SCALE`
 */
export const KNOCKBACK_VELOCITY_SCALE = 0.3;

/** Minimum seconds between collision impact sounds. */
export const IMPACT_COOLDOWN = 0.4;

/** Number of particles in the knockout mega-burst. */
export const KNOCKOUT_BURST_COUNT = 80;

export interface KnockbackDeps {
    /** The player's rigid body. */
    body: {
        applyImpulse: (x: number, y: number, z: number) => void;
        linearVelocity: { x: number; y: number; z: number };
    };
    /** The player's transform component. */
    transform: InstanceType<typeof Transform>;
    /** The player's dash state (to cancel on hit). */
    dash: DashState;
    /** Player index (0 or 1). */
    playerId: number;
    /** Whether online replication is enabled. */
    replicate: boolean;
    /** Impact sound effect. */
    impactSfx: { play: () => void };
    /** Impact particle burst function. */
    impactBurst: (pos: [number, number, number]) => void;
    /** Shockwave pool trigger. */
    shockwavePool: { trigger: (opts: { centerX: number; centerY: number }) => void };
    /** Hit impact pool trigger. */
    hitImpactPool: { trigger: (opts: { worldX: number; worldZ: number }) => void };
    /** Three.js camera for screen projection. */
    threeCamera: { projectionMatrix: unknown; matrixWorldInverse: unknown };
    /** Replay state. */
    replay: unknown;
    /** Velocity states map. */
    velocityStates: unknown;
    /** Player radius for surface-point calculation. */
    playerRadius: number;
    /** Returns the current game phase. */
    getPhase: () => string;
}

/**
 * Set up knockback collision handling and (optionally) the online knockback channel.
 * Call at the top level of a node function.
 *
 * @param deps - Dependencies from the parent node.
 *
 * @example
 * ```ts
 * useKnockback({ body, transform, dash, playerId, ... });
 * ```
 */
export function useKnockback(deps: KnockbackDeps): void {
    const node = useNode();
    const impactCD = useCooldown(IMPACT_COOLDOWN);

    // Pre-solver velocity snapshot for online mode correction
    let prePhysVx = 0;
    let prePhysVz = 0;
    if (deps.replicate) {
        useFixedEarly(() => {
            prePhysVx = deps.body.linearVelocity.x;
            prePhysVz = deps.body.linearVelocity.z;
        });
    }

    // Shared knockback application helper
    const applyKnockbackEffects = (impulse: [number, number, number]): void => {
        deps.body.applyImpulse(impulse[0], impulse[1], impulse[2]);

        // Cancel any active dash and reset cooldown
        deps.dash.timer.cancel();
        deps.dash.cooldown.trigger();

        deps.impactSfx.play();
        impactCD.trigger();

        // Particle burst at surface facing hit direction
        const hx = -impulse[0];
        const hz = -impulse[2];
        const hLen = Math.sqrt(hx * hx + hz * hz);
        if (hLen > 0) {
            const surfX =
                deps.transform.localPosition.x +
                (hx / hLen) * deps.playerRadius;
            const surfY = deps.transform.localPosition.y;
            const surfZ =
                deps.transform.localPosition.z +
                (hz / hLen) * deps.playerRadius;
            deps.impactBurst([surfX, surfY, surfZ]);

            const [su, sv] = worldToScreen(
                surfX,
                surfY,
                surfZ,
                deps.threeCamera as Parameters<typeof worldToScreen>[3],
            );
            deps.shockwavePool.trigger({ centerX: su, centerY: sv });
            deps.hitImpactPool.trigger({ worldX: surfX, worldZ: surfZ });
        }

        triggerCameraShake(0.3, 0.2);
        markHit(deps.replay as Parameters<typeof markHit>[0]);
    };

    // Bidirectional knockback channel (online mode)
    let publishKnockback: ((impulse: [number, number, number]) => void) | null =
        null;
    if (deps.replicate) {
        const kb = useChannel<[number, number, number]>(
            'knockback',
            (impulse) => {
                if (deps.getPhase() !== 'playing') return;
                // Dedup: if we already handled a collision locally, skip.
                if (!impactCD.ready) return;

                // Strip velocity component toward opponent
                const imag = Math.sqrt(
                    impulse[0] * impulse[0] + impulse[2] * impulse[2],
                );
                if (imag > 0.01) {
                    const awayX = impulse[0] / imag;
                    const awayZ = impulse[2] / imag;
                    const towardComponent =
                        deps.body.linearVelocity.x * -awayX +
                        deps.body.linearVelocity.z * -awayZ;
                    if (towardComponent > 0) {
                        deps.body.linearVelocity.x += towardComponent * awayX;
                        deps.body.linearVelocity.z += towardComponent * awayZ;
                    }
                }

                applyKnockbackEffects(impulse);
            },
        );
        publishKnockback = (impulse) => kb.publish(impulse);
    }

    // Collision handler
    useOnCollisionStart(
        ({ other }) => {
            if (other === node) return;
            if (!impactCD.ready) return;

            const otherTransform = getComponent(other, Transform);
            if (!otherTransform) return;

            const otherPlayerId = 1 - deps.playerId;
            const [otherVx, otherVz] = getPlayerVelocity(
                deps.velocityStates as Parameters<typeof getPlayerVelocity>[0],
                otherPlayerId,
            );

            // Online mode: correct physics solver's velocity bounce
            if (deps.replicate) {
                const cdx =
                    otherTransform.localPosition.x -
                    deps.transform.localPosition.x;
                const cdz =
                    otherTransform.localPosition.z -
                    deps.transform.localPosition.z;
                const clen = Math.sqrt(cdx * cdx + cdz * cdz);
                if (clen > 0.01) {
                    const nx = cdx / clen;
                    const nz = cdz / clen;
                    const myNormal = prePhysVx * nx + prePhysVz * nz;
                    const otherNormal = otherVx * nx + otherVz * nz;
                    const e = 0.2;
                    const correctedNormal =
                        ((1 - e) / 2) * myNormal +
                        ((1 + e) / 2) * otherNormal;
                    const solverNormal =
                        deps.body.linearVelocity.x * nx +
                        deps.body.linearVelocity.z * nz;
                    deps.body.linearVelocity.x +=
                        (correctedNormal - solverNormal) * nx;
                    deps.body.linearVelocity.z +=
                        (correctedNormal - solverNormal) * nz;
                } else {
                    deps.body.linearVelocity.x = 0;
                    deps.body.linearVelocity.z = 0;
                }
            }

            const approachSpeed = computeApproachSpeed(
                deps.transform.localPosition.x,
                deps.transform.localPosition.z,
                otherTransform.localPosition.x,
                otherTransform.localPosition.z,
                otherVx,
                otherVz,
            );
            const effectiveForce =
                KNOCKBACK_BASE + approachSpeed * KNOCKBACK_VELOCITY_SCALE;

            const [ix, iy, iz] = computeKnockback(
                deps.transform.localPosition.x,
                deps.transform.localPosition.z,
                otherTransform.localPosition.x,
                otherTransform.localPosition.z,
                effectiveForce,
            );

            applyKnockbackEffects([ix, iy, iz]);

            // Online: send other player's knockback
            if (publishKnockback) {
                const [myVx, myVz] = getPlayerVelocity(
                    deps.velocityStates as Parameters<
                        typeof getPlayerVelocity
                    >[0],
                    deps.playerId,
                );
                const myApproach = computeApproachSpeed(
                    otherTransform.localPosition.x,
                    otherTransform.localPosition.z,
                    deps.transform.localPosition.x,
                    deps.transform.localPosition.z,
                    myVx,
                    myVz,
                );
                const otherForce =
                    KNOCKBACK_BASE + myApproach * KNOCKBACK_VELOCITY_SCALE;

                const [ox, oy, oz] = computeKnockback(
                    otherTransform.localPosition.x,
                    otherTransform.localPosition.z,
                    deps.transform.localPosition.x,
                    deps.transform.localPosition.z,
                    otherForce,
                );

                publishKnockback([ox, oy, oz]);
            }
        },
        { filter: PlayerTag },
    );
}
