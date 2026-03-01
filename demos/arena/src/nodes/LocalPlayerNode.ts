import {
    useComponent,
    useFixedEarly,
    useFixedUpdate,
    useFrameUpdate,
    useWorld,
    useContext,
    useStableId,
    useNode,
    getComponent,
    Transform,
    useTimer,
    useCooldown,
} from '@pulse-ts/core';
import { useAxis2D, useAction } from '@pulse-ts/input';
import {
    useRigidBody,
    useSphereCollider,
    useOnCollisionStart,
} from '@pulse-ts/physics';
import { useMesh } from '@pulse-ts/three';
import { useSound } from '@pulse-ts/audio';
import { useParticleBurst, useParticleEmitter } from '@pulse-ts/effects';
import { PlayerTag } from '../components/PlayerTag';
import { GameCtx } from '../contexts';
import { SPAWN_POSITIONS, DEATH_PLANE_Y } from '../config/arena';

/** Sphere radius for the player ball. */
export const PLAYER_RADIUS = 0.8;

/** Impulse applied per fixed tick when movement input is held. */
export const MOVE_IMPULSE = 0.6;

/** Linear damping — lower values mean longer coasting and harder to control. */
export const LINEAR_DAMPING = 0.15;

/** Velocity applied during a dash. */
export const DASH_SPEED = 30;

/** Duration of a dash in seconds. */
export const DASH_DURATION = 0.15;

/** Cooldown between dashes in seconds. */
export const DASH_COOLDOWN = 1.0;

/** Knockback impulse magnitude applied on player-player collision. */
export const KNOCKBACK_FORCE = 20;

/** Minimum seconds between collision impact sounds. */
export const IMPACT_COOLDOWN = 0.4;

/** Number of particles in the knockout mega-burst. */
export const KNOCKOUT_BURST_COUNT = 80;

/** Emission rate (particles/sec) for the dash trail. */
export const DASH_TRAIL_RATE = 100;

/** Player colors: P1 = teal, P2 = coral. */
const PLAYER_COLORS = [0x48c9b0, 0xe74c3c] as const;

/**
 * Compute a knockback impulse vector from one position to another.
 * The impulse points away from the other player and is scaled by the
 * given magnitude. Includes an upward component for arc.
 *
 * @param selfX - Local player X position.
 * @param selfZ - Local player Z position.
 * @param otherX - Other player X position.
 * @param otherZ - Other player Z position.
 * @param magnitude - Impulse strength.
 * @returns An `[x, y, z]` impulse vector.
 *
 * @example
 * ```ts
 * computeKnockback(0, 0, -1, 0, 8); // [8, 0, 0] — pushed right
 * ```
 */
export function computeKnockback(
    selfX: number,
    selfZ: number,
    otherX: number,
    otherZ: number,
    magnitude: number,
): [number, number, number] {
    const dx = selfX - otherX;
    const dz = selfZ - otherZ;
    const len = Math.sqrt(dx * dx + dz * dz);
    if (len > 0) {
        return [(dx / len) * magnitude, 0, (dz / len) * magnitude];
    }
    // Overlapping — push in arbitrary direction
    return [magnitude, 0, 0];
}

/**
 * Compute the normalized dash direction from a movement input vector.
 * If the input is zero-length, defaults to forward (negative Z).
 *
 * @param moveX - Horizontal input axis value.
 * @param moveY - Vertical input axis value (W/up = positive).
 * @returns A normalized `[x, z]` direction tuple in world space.
 *
 * @example
 * ```ts
 * computeDashDirection(1, 0);  // [1, 0]  — dash right
 * computeDashDirection(0, 1);  // [0, -1] — dash forward
 * computeDashDirection(0, 0);  // [0, -1] — default forward
 * ```
 */
export function computeDashDirection(
    moveX: number,
    moveY: number,
): [number, number] {
    const len = Math.sqrt(moveX * moveX + moveY * moveY);
    if (len > 0) {
        return [moveX / len, -moveY / len]; // W = forward = -Z
    }
    return [0, -1]; // default forward
}

export interface LocalPlayerNodeProps {
    /** Player index (0 or 1). */
    playerId: number;
    /** Input action name for the 2D movement axis (e.g. 'p1Move'). */
    moveAction: string;
    /** Input action name for the dash button (e.g. 'p1Dash'). */
    dashAction: string;
}

/**
 * Local player node — a dynamic sphere with movement and a dash mechanic.
 * Each instance controls one player, reading from its own namespaced
 * input actions so both players coexist in a single world.
 */
export function LocalPlayerNode({
    playerId,
    moveAction,
    dashAction,
}: Readonly<LocalPlayerNodeProps>) {
    const node = useNode();
    const gameState = useContext(GameCtx);
    const spawn = SPAWN_POSITIONS[playerId];

    useStableId(`player-${playerId}`);

    useComponent(PlayerTag);

    const transform = useComponent(Transform);
    transform.localPosition.set(...spawn);

    const body = useRigidBody({
        type: 'dynamic',
        mass: 1,
        linearDamping: LINEAR_DAMPING,
        angularDamping: 1,
    });
    // Lock rotation so the ball doesn't tumble
    body.setInertiaTensor(0, 0, 0);

    useSphereCollider(PLAYER_RADIUS, {
        friction: 0.3,
        restitution: 0.2,
    });

    const world = useWorld();
    const getMove = useAxis2D(moveAction);
    const getDash = useAction(dashAction);

    // Dash state
    const dashTimer = useTimer(DASH_DURATION);
    const dashCD = useCooldown(DASH_COOLDOWN);
    const impactCD = useCooldown(IMPACT_COOLDOWN);
    let dashDirX = 0;
    let dashDirZ = 0;

    // Track round number to detect round resets via shared state
    let lastRound = gameState.round;

    // Previous physics position for frame interpolation
    let prevX = spawn[0];
    let prevY = spawn[1];
    let prevZ = spawn[2];

    useFixedEarly(() => {
        prevX = transform.localPosition.x;
        prevY = transform.localPosition.y;
        prevZ = transform.localPosition.z;
    });

    // Visual — sphere mesh
    const { root } = useMesh('sphere', {
        radius: PLAYER_RADIUS,
        color: PLAYER_COLORS[playerId],
        roughness: 0.4,
        metalness: 0.3,
        castShadow: true,
    });

    // Sound effects
    const dashSfx = useSound('noise', {
        filter: 'bandpass',
        frequency: [2000, 500],
        duration: 0.15,
        gain: 0.12,
    });
    const deathSfx = useSound('tone', {
        wave: 'sawtooth',
        frequency: [600, 150],
        duration: 0.2,
        gain: 0.12,
    });
    const impactSfx = useSound('tone', {
        wave: 'square',
        frequency: [300, 100],
        duration: 0.1,
        gain: 0.15,
    });

    // Particle burst for collision impact
    const impactBurst = useParticleBurst({
        count: 16,
        lifetime: 0.4,
        color: 0xffffff,
        speed: [1, 3],
        gravity: 6,
        size: 0.3,
        blending: 'additive',
    });

    // Knockout mega-burst — player-colored explosion on death
    const knockoutBurst = useParticleBurst({
        count: KNOCKOUT_BURST_COUNT,
        lifetime: 0.6,
        color: PLAYER_COLORS[playerId],
        speed: [2, 6],
        gravity: 8,
        size: 0.4,
        blending: 'additive',
        shrink: true,
    });

    // Dash trail — continuous emitter active only while dashing
    const dashTrail = useParticleEmitter({
        rate: DASH_TRAIL_RATE,
        lifetime: 0.3,
        color: PLAYER_COLORS[playerId],
        speed: [0.5, 1.5],
        gravity: 2,
        size: 0.25,
        blending: 'additive',
        shrink: true,
        autoStart: false,
    });

    // Knockback on collision with another player
    useOnCollisionStart(({ other }) => {
        if (other === node) return;
        if (!getComponent(other, PlayerTag)) return;

        const otherTransform = getComponent(other, Transform);
        if (!otherTransform) return;

        const [ix, iy, iz] = computeKnockback(
            transform.localPosition.x,
            transform.localPosition.z,
            otherTransform.localPosition.x,
            otherTransform.localPosition.z,
            KNOCKBACK_FORCE,
        );
        body.applyImpulse(ix, iy, iz);
        if (impactCD.ready) {
            impactSfx.play();
            impactCD.trigger();
        }

        // Particle burst at the midpoint between the two players
        impactBurst([
            (transform.localPosition.x + otherTransform.localPosition.x) / 2,
            (transform.localPosition.y + otherTransform.localPosition.y) / 2,
            (transform.localPosition.z + otherTransform.localPosition.z) / 2,
        ]);
    });

    useFixedUpdate(() => {
        // Round reset — teleport to spawn when GameManagerNode increments round
        if (gameState.round !== lastRound) {
            lastRound = gameState.round;
            transform.localPosition.set(...spawn);
            body.setLinearVelocity(0, 0, 0);
            dashTimer.cancel();
            dashCD.reset();
            dashTrail.pause();
        }

        // Freeze input during non-playing phases
        if (gameState.phase !== 'playing') {
            const vy = body.linearVelocity.y;
            body.setLinearVelocity(0, vy, 0);
            dashTimer.cancel();
            if (dashTrail.active) dashTrail.pause();

            // Still check death plane during freeze for safety
            if (transform.localPosition.y < DEATH_PLANE_Y) {
                transform.localPosition.set(...spawn);
                body.setLinearVelocity(0, 0, 0);
            }
            return;
        }

        const move = getMove();
        const dashAction = getDash();

        // Dash activation
        if (dashAction.pressed && dashCD.ready && !dashTimer.active) {
            [dashDirX, dashDirZ] = computeDashDirection(move.x, move.y);
            dashTimer.reset();
            dashCD.trigger();
            dashSfx.play();
            dashTrail.resume();
        }

        if (dashTimer.active) {
            // During dash, override horizontal velocity with locked direction
            const vy = body.linearVelocity.y;
            body.setLinearVelocity(
                dashDirX * DASH_SPEED,
                vy,
                dashDirZ * DASH_SPEED,
            );
        } else {
            if (dashTrail.active) dashTrail.pause();
            // Momentum-based movement — apply impulse, damping handles deceleration
            const ix = move.x * MOVE_IMPULSE;
            const iz = -move.y * MOVE_IMPULSE;
            if (ix !== 0 || iz !== 0) {
                body.applyImpulse(ix, 0, iz);
            }
        }

        // Death plane — respawn when falling off the arena
        if (transform.localPosition.y < DEATH_PLANE_Y) {
            knockoutBurst([
                transform.localPosition.x,
                transform.localPosition.y,
                transform.localPosition.z,
            ]);
            dashTrail.pause();
            deathSfx.play();
            gameState.pendingKnockout = playerId;
            transform.localPosition.set(...spawn);
            body.setLinearVelocity(0, 0, 0);
            dashTimer.cancel();
            dashCD.reset();
        }
    });

    // Interpolate visual position for smooth rendering
    useFrameUpdate(() => {
        const alpha = world.getAmbientAlpha();
        const cur = transform.localPosition;
        root.position.set(
            prevX + (cur.x - prevX) * alpha,
            prevY + (cur.y - prevY) * alpha,
            prevZ + (cur.z - prevZ) * alpha,
        );
    });
}
