import {
    useComponent,
    useFixedEarly,
    useFixedUpdate,
    useFrameUpdate,
    useWorld,
    useContext,
    useStableId,
    Transform,
    useTimer,
    useCooldown,
} from '@pulse-ts/core';
import { useAxis2D, useAction } from '@pulse-ts/input';
import { useRigidBody, useSphereCollider } from '@pulse-ts/physics';
import { useMesh } from '@pulse-ts/three';
import { useSound } from '@pulse-ts/audio';
import { useReplicateTransform, useChannel } from '@pulse-ts/network';
import { PlayerTag } from '../components/PlayerTag';
import { PlayerIdCtx } from '../contexts';
import { SPAWN_POSITIONS, DEATH_PLANE_Y } from '../config/arena';
import { KnockoutChannel } from '../config/channels';

/** Sphere radius for the player ball. */
export const PLAYER_RADIUS = 0.5;

/** Movement speed in units per second. */
export const MOVE_SPEED = 12;

/** Velocity applied during a dash. */
export const DASH_SPEED = 30;

/** Duration of a dash in seconds. */
export const DASH_DURATION = 0.15;

/** Cooldown between dashes in seconds. */
export const DASH_COOLDOWN = 1.0;

/** Player colors: P1 = teal, P2 = coral. */
const PLAYER_COLORS = [0x48c9b0, 0xe74c3c] as const;

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

/**
 * Local player node — a dynamic sphere with WASD/arrow movement and a dash
 * mechanic. Each world instance mounts one of these for its local player.
 */
export function LocalPlayerNode() {
    const playerId = useContext(PlayerIdCtx);
    const spawn = SPAWN_POSITIONS[playerId];

    // Network identity and replication — send our transform to the other world
    useStableId(`player-${playerId}`);
    useReplicateTransform({ role: 'producer' });

    useComponent(PlayerTag);

    const transform = useComponent(Transform);
    transform.localPosition.set(...spawn);

    const body = useRigidBody({
        type: 'dynamic',
        mass: 1,
        linearDamping: 0.05,
        angularDamping: 1,
    });
    // Lock rotation so the ball doesn't tumble
    body.setInertiaTensor(0, 0, 0);

    useSphereCollider(PLAYER_RADIUS, {
        friction: 0.3,
        restitution: 0.2,
    });

    const world = useWorld();
    const getMove = useAxis2D('move');
    const getDash = useAction('dash');

    // Knockout channel — publish when falling off the arena
    const knockout = useChannel(KnockoutChannel);

    // Dash state
    const dashTimer = useTimer(DASH_DURATION);
    const dashCD = useCooldown(DASH_COOLDOWN);
    let dashDirX = 0;
    let dashDirZ = 0;

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

    useFixedUpdate(() => {
        const move = getMove();
        const dashAction = getDash();

        // Dash activation
        if (dashAction.pressed && dashCD.ready && !dashTimer.active) {
            [dashDirX, dashDirZ] = computeDashDirection(move.x, move.y);
            dashTimer.reset();
            dashCD.trigger();
            dashSfx.play();
        }

        const vy = body.linearVelocity.y;

        if (dashTimer.active) {
            // During dash, override horizontal velocity with locked direction
            body.setLinearVelocity(
                dashDirX * DASH_SPEED,
                vy,
                dashDirZ * DASH_SPEED,
            );
        } else {
            // Normal movement — set velocity directly for tight control
            const vx = move.x * MOVE_SPEED;
            const vz = -move.y * MOVE_SPEED; // W = forward = -Z
            body.setLinearVelocity(vx, vy, vz);
        }

        // Death plane — respawn when falling off the arena
        if (transform.localPosition.y < DEATH_PLANE_Y) {
            deathSfx.play();
            knockout.publish(playerId);
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
