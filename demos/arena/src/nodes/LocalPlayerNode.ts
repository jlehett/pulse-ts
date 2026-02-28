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
import { useParticleBurst } from '@pulse-ts/effects';
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

/** Knockback impulse magnitude applied on player-player collision. */
export const KNOCKBACK_FORCE = 8;

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
 * computeKnockback(0, 0, -1, 0, 8); // [8, 4, 0] — pushed right + up
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
        return [
            (dx / len) * magnitude,
            magnitude * 0.5,
            (dz / len) * magnitude,
        ];
    }
    // Overlapping — push in arbitrary direction with upward arc
    return [magnitude, magnitude * 0.5, 0];
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

/**
 * Local player node — a dynamic sphere with WASD/arrow movement and a dash
 * mechanic. Each world instance mounts one of these for its local player.
 */
export function LocalPlayerNode() {
    const node = useNode();
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
        impactSfx.play();

        // Particle burst at the midpoint between the two players
        impactBurst([
            (transform.localPosition.x + otherTransform.localPosition.x) / 2,
            (transform.localPosition.y + otherTransform.localPosition.y) / 2,
            (transform.localPosition.z + otherTransform.localPosition.z) / 2,
        ]);
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
