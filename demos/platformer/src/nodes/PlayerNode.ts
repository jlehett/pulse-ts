import {
    useComponent,
    useNode,
    useFixedEarly,
    useFixedUpdate,
    useFrameUpdate,
    useWorld,
    getComponent,
    Transform,
    Vec3,
    useContext,
    useTimer,
    useCooldown,
} from '@pulse-ts/core';
import { useAction, useAxis2D } from '@pulse-ts/input';
import { RespawnCtx, ShakeCtx } from '../contexts';
import {
    useRigidBody,
    useCapsuleCollider,
    usePhysicsRaycast,
    RigidBody,
    getKinematicSurfaceVelocity,
} from '@pulse-ts/physics';
import { useMesh } from '@pulse-ts/three';
import { useSound } from '@pulse-ts/audio';
import { PlayerTag } from '../components/PlayerTag';

const MOVE_SPEED = 8;
const JUMP_IMPULSE = 5.5;
const JUMP_HOLD_FORCE = 38; // upward force per second while holding jump
const JUMP_HOLD_MAX = 0.18; // max hold duration in seconds
const GROUND_RAY_DIST = 1.15;
const PLAYER_RADIUS = 0.3;
const PLAYER_HALF_HEIGHT = 0.4;
const COYOTE_TIME = 0.12; // 120ms grace window after leaving ground
const DASH_SPEED = 25; // velocity during dash
const DASH_DURATION = 0.15; // seconds the dash lasts
const DASH_COOLDOWN = 1.0; // seconds before next dash

/**
 * Shared mutable object that tracks the player's current respawn position.
 * Updated by CheckpointNode when the player activates a checkpoint.
 */
export interface RespawnState {
    position: [number, number, number];
}

/**
 * Shared mutable object for camera shake. PlayerNode writes `intensity` on
 * hard landings; CameraRigNode reads and decays it each frame.
 */
export interface ShakeState {
    intensity: number;
}

/** Minimum absolute vertical velocity (m/s) to trigger a camera shake on landing. */
export const LANDING_VEL_THRESHOLD = 6;

/**
 * Multiplier that converts excess landing velocity (above threshold) into
 * shake intensity. Higher values produce stronger shakes.
 */
export const SHAKE_INTENSITY_SCALE = 0.15;

export interface PlayerNodeProps {
    spawn: [number, number, number];
    deathPlaneY: number;
}

export function PlayerNode(props: Readonly<PlayerNodeProps>) {
    const node = useNode();
    const respawnState = useContext(RespawnCtx);
    const shakeState = useContext(ShakeCtx);
    useComponent(PlayerTag);
    const transform = useComponent(Transform);
    transform.localPosition.set(...props.spawn);

    const body = useRigidBody({
        type: 'dynamic',
        mass: 1,
        linearDamping: 0.05,
        angularDamping: 1,
    });
    // Lock rotation so player doesn't tumble
    body.setInertiaTensor(0, 0, 0);

    useCapsuleCollider(PLAYER_RADIUS, PLAYER_HALF_HEIGHT, {
        friction: 0.3,
        restitution: 0,
    });

    const world = useWorld();
    const getMove = useAxis2D('move');
    const getJump = useAction('jump');
    const getDash = useAction('dash');
    const raycast = usePhysicsRaycast();

    // Prevents double-jumping: set true when a jump impulse is applied, cleared
    // only once the raycast returns null (player has physically left the ground).
    // Without this, rapid presses fire a second impulse on the next fixed step
    // before physics has had a chance to move the player upward.
    let jumpLock = false;
    const coyote = useTimer(COYOTE_TIME);
    const jumpHold = useTimer(JUMP_HOLD_MAX);
    const dash = useTimer(DASH_DURATION);
    const dashCD = useCooldown(DASH_COOLDOWN);
    let dashDirX = 0;
    let dashDirZ = 0;
    let prevGrounded = false;

    // Previous physics position — captured in fixed.early (before PhysicsSystem
    // integrates transforms in fixed.update) so that during frame rendering we
    // can interpolate between the previous and current physics positions using
    // the loop alpha (fraction of the fixed step elapsed this frame).
    let prevX = props.spawn[0];
    let prevY = props.spawn[1];
    let prevZ = props.spawn[2];

    useFixedEarly(() => {
        prevX = transform.localPosition.x;
        prevY = transform.localPosition.y;
        prevZ = transform.localPosition.z;
    });

    // Three.js visual — capsule geometry
    const { root } = useMesh('capsule', {
        radius: PLAYER_RADIUS,
        length: PLAYER_HALF_HEIGHT * 2,
        capSegments: 8,
        radialSegments: 16,
        color: 0x48c9b0,
        castShadow: true,
    });

    // Procedural sound effects
    const jumpSfx = useSound('tone', {
        wave: 'square',
        frequency: [400, 800],
        duration: 0.08,
        gain: 0.1,
    });
    const landSfx = useSound('tone', {
        wave: 'triangle',
        frequency: 80,
        duration: 0.1,
        gain: 0.15,
    });
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

    // Raycast origin scratch vector
    const rayOrigin = new Vec3();
    const rayDir = new Vec3(0, -1, 0);

    useFixedUpdate((dt) => {
        const move = getMove();
        const jump = getJump();
        const dashAction = getDash();

        // Ground check via downward raycast from player center
        const pos = transform.localPosition;
        rayOrigin.set(pos.x, pos.y, pos.z);
        const hit = raycast(rayOrigin, rayDir, GROUND_RAY_DIST, (c) => c.owner !== node);
        const grounded = hit !== null;

        // Detect landing: transition from airborne to grounded. Capture the
        // vertical speed before it is zeroed by the ground contact so we can
        // scale shake intensity by impact velocity.
        if (!prevGrounded && grounded) {
            landSfx.play();
            const absVy = Math.abs(body.linearVelocity.y);
            if (absVy > LANDING_VEL_THRESHOLD) {
                shakeState.intensity =
                    (absVy - LANDING_VEL_THRESHOLD) * SHAKE_INTENSITY_SCALE;
            }
        }

        // Release the jump lock once the player has actually left the ground.
        if (!grounded) jumpLock = false;

        // Coyote time: while grounded, keep the timer refreshed; while airborne,
        // let it count down so the player has a brief grace window to jump.
        // Guard with !jumpLock so that after a real jump the timer stays
        // consumed — otherwise the raycast still reads "grounded" for a few
        // steps while the player rises, refilling the timer and enabling a
        // double-jump.
        if (grounded && !jumpLock) {
            coyote.reset();
        }

        // Inherit XZ velocity from kinematic platform (if grounded on one)
        let platformVx = 0;
        let platformVz = 0;
        if (hit) {
            const platformBody = getComponent(hit.node, RigidBody);
            if (platformBody && platformBody.type === 'kinematic') {
                const platformTransform = getComponent(hit.node, Transform);
                if (platformTransform) {
                    const [svx, , svz] = getKinematicSurfaceVelocity(
                        platformBody.linearVelocity,
                        platformBody.angularVelocity,
                        platformTransform.localPosition,
                        hit.point,
                        dt,
                    );
                    platformVx = svx;
                    platformVz = svz;
                }
            }
        }

        // Dash activation — lock direction on press, ignore during cooldown
        if (dashAction.pressed && dashCD.ready && !dash.active) {
            const len = Math.sqrt(move.x * move.x + move.y * move.y);
            if (len > 0) {
                dashDirX = move.x / len;
                dashDirZ = -move.y / len; // W = forward = -Z
            } else {
                dashDirX = 0;
                dashDirZ = -1;
            }
            dash.reset();
            dashCD.trigger();
            dashSfx.play();
        }

        // Horizontal movement — set velocity directly for tight control
        const vx = move.x * MOVE_SPEED + platformVx;
        const vz = -move.y * MOVE_SPEED + platformVz; // W = forward = -Z
        const vy = body.linearVelocity.y;

        // During a dash, override horizontal velocity with the locked dash direction
        if (dash.active) {
            body.setLinearVelocity(dashDirX * DASH_SPEED, vy, dashDirZ * DASH_SPEED);
        } else {
            body.setLinearVelocity(vx, vy, vz);
        }

        // Jump — use coyote timer instead of grounded so the player can jump
        // briefly after walking off a ledge. jumpLock still prevents double-jumps.
        if (jump.pressed && coyote.active && !jumpLock) {
            body.applyImpulse(0, JUMP_IMPULSE, 0);
            jumpSfx.play();
            jumpLock = true;
            coyote.cancel(); // consume the grace window
            jumpHold.reset(); // start the hold window
        }

        // Variable jump height — apply additional upward force while the jump
        // button is held and the hold window hasn't expired.
        if (jump.down && jumpHold.active) {
            body.applyForce(0, JUMP_HOLD_FORCE, 0);
        } else {
            jumpHold.cancel(); // button released early — kill the window
        }

        prevGrounded = grounded;

        // Death plane respawn
        if (pos.y < props.deathPlaneY) {
            deathSfx.play();
            transform.localPosition.set(...respawnState.position);
            body.setLinearVelocity(0, 0, 0);
            jumpLock = false;
            coyote.cancel();
            jumpHold.cancel();
            dash.cancel();
            dashCD.reset();
            prevGrounded = false;
        }
    });

    // Interpolate the Three.js mesh between the previous and current physics
    // positions using the loop alpha (fraction of fixed step elapsed this frame).
    // This eliminates the per-step jitter visible when physics runs at 60 Hz
    // but the renderer runs at a different rate (e.g. 120 Hz or unlocked).
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
