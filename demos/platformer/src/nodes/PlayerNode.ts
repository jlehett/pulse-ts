import * as THREE from 'three';
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
} from '@pulse-ts/core';
import { useAction, useAxis2D } from '@pulse-ts/input';
import {
    useRigidBody,
    useCapsuleCollider,
    usePhysicsRaycast,
    RigidBody,
} from '@pulse-ts/physics';
import { useThreeRoot, useObject3D } from '@pulse-ts/three';
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
 * Computes the XZ velocity needed for a point on a kinematic platform to follow
 * the platform's motion over one fixed step. For the rotational component, this
 * rotates the contact offset by `ωy * dt` (exact arc) rather than using the
 * tangent approximation (`ω × r`), which eliminates outward drift on spinning
 * platforms.
 *
 * @param platformBody - The kinematic rigid body of the platform.
 * @param platformPos - The platform's world-space position.
 * @param contactPoint - The world-space contact point (e.g. from a raycast hit).
 * @param dt - The fixed timestep in seconds.
 * @returns A `[vx, vz]` tuple representing the platform's XZ velocity at the contact point.
 *
 * @example
 * ```ts
 * const [pvx, pvz] = getKinematicSurfaceVelocityXZ(body, transform.localPosition, hit.point, dt);
 * ```
 */
export function getKinematicSurfaceVelocityXZ(
    platformBody: RigidBody,
    platformPos: { x: number; y: number; z: number },
    contactPoint: { x: number; y: number; z: number },
    dt: number,
): [number, number] {
    let vx = platformBody.linearVelocity.x;
    let vz = platformBody.linearVelocity.z;

    // Rotational contribution: rotate the offset vector by ωy * dt, then
    // derive the velocity needed to reach that rotated point in one step.
    // This gives both tangential and centripetal components automatically,
    // preventing outward drift that the tangent-only approximation (ω × r)
    // would cause.
    const wy = platformBody.angularVelocity.y;
    if (wy !== 0) {
        const rx = contactPoint.x - platformPos.x;
        const rz = contactPoint.z - platformPos.z;
        // Negate: in a Y-up right-hand system, positive ωy rotates +X toward
        // -Z (clockwise when viewed from above), but the standard 2D rotation
        // matrix rotates +X toward +Z. Negating aligns the two conventions.
        const angle = -wy * dt;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        // Rotated offset after one step
        const newRx = rx * cos - rz * sin;
        const newRz = rx * sin + rz * cos;
        // Velocity = displacement / dt
        vx += (newRx - rx) / dt;
        vz += (newRz - rz) / dt;
    }

    return [vx, vz];
}

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
export const SHAKE_INTENSITY_SCALE = 0.04;

export interface PlayerNodeProps {
    spawn: [number, number, number];
    deathPlaneY: number;
    respawnState: RespawnState;
    shakeState: ShakeState;
}

export function PlayerNode(props: Readonly<PlayerNodeProps>) {
    const node = useNode();
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
    let coyoteTimer = 0;
    let jumpHoldTimer = 0;
    let dashTimer = 0;
    let dashCooldown = 0;
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
    const root = useThreeRoot();
    const geometry = new THREE.CapsuleGeometry(
        PLAYER_RADIUS,
        PLAYER_HALF_HEIGHT * 2,
        8,
        16,
    );
    const material = new THREE.MeshStandardMaterial({ color: 0x48c9b0 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    useObject3D(mesh);

    // Raycast origin scratch vector
    const rayOrigin = new Vec3();
    const rayDir = new Vec3(0, -1, 0);

    useFixedUpdate((dt) => {
        const move = getMove();
        const jump = getJump();
        const dash = getDash();

        // Ground check via downward raycast from player center
        const pos = transform.localPosition;
        rayOrigin.set(pos.x, pos.y, pos.z);
        const hit = raycast(rayOrigin, rayDir, GROUND_RAY_DIST, (c) => c.owner !== node);
        const grounded = hit !== null;

        // Detect landing: transition from airborne to grounded. Capture the
        // vertical speed before it is zeroed by the ground contact so we can
        // scale shake intensity by impact velocity.
        if (!prevGrounded && grounded) {
            const absVy = Math.abs(body.linearVelocity.y);
            if (absVy > LANDING_VEL_THRESHOLD) {
                props.shakeState.intensity =
                    (absVy - LANDING_VEL_THRESHOLD) * SHAKE_INTENSITY_SCALE;
            }
        }

        // Release the jump lock once the player has actually left the ground.
        if (!grounded) jumpLock = false;

        // Coyote time: while grounded, keep the timer full; while airborne,
        // count it down so the player has a brief grace window to jump.
        // Guard with !jumpLock so that after a real jump the timer stays
        // consumed — otherwise the raycast still reads "grounded" for a few
        // steps while the player rises, refilling the timer and enabling a
        // double-jump.
        if (grounded && !jumpLock) {
            coyoteTimer = COYOTE_TIME;
        } else if (!grounded) {
            coyoteTimer = Math.max(0, coyoteTimer - dt);
        }

        // Inherit XZ velocity from kinematic platform (if grounded on one)
        let platformVx = 0;
        let platformVz = 0;
        if (hit) {
            const platformBody = getComponent(hit.node, RigidBody);
            if (platformBody && platformBody.type === 'kinematic') {
                const platformTransform = getComponent(hit.node, Transform);
                if (platformTransform) {
                    [platformVx, platformVz] = getKinematicSurfaceVelocityXZ(
                        platformBody,
                        platformTransform.localPosition,
                        hit.point,
                        dt,
                    );
                }
            }
        }

        // Dash activation — lock direction on press, ignore during cooldown
        if (dash.pressed && dashCooldown <= 0 && dashTimer <= 0) {
            const len = Math.sqrt(move.x * move.x + move.y * move.y);
            if (len > 0) {
                dashDirX = move.x / len;
                dashDirZ = -move.y / len; // W = forward = -Z
            } else {
                dashDirX = 0;
                dashDirZ = -1;
            }
            dashTimer = DASH_DURATION;
            dashCooldown = DASH_COOLDOWN;
        }

        // Horizontal movement — set velocity directly for tight control
        const vx = move.x * MOVE_SPEED + platformVx;
        const vz = -move.y * MOVE_SPEED + platformVz; // W = forward = -Z
        const vy = body.linearVelocity.y;

        // During a dash, override horizontal velocity with the locked dash direction
        if (dashTimer > 0) {
            body.setLinearVelocity(dashDirX * DASH_SPEED, vy, dashDirZ * DASH_SPEED);
            dashTimer = Math.max(0, dashTimer - dt);
        } else {
            body.setLinearVelocity(vx, vy, vz);
        }

        dashCooldown = Math.max(0, dashCooldown - dt);

        // Jump — use coyoteTimer instead of grounded so the player can jump
        // briefly after walking off a ledge. jumpLock still prevents double-jumps.
        if (jump.pressed && coyoteTimer > 0 && !jumpLock) {
            body.applyImpulse(0, JUMP_IMPULSE, 0);
            jumpLock = true;
            coyoteTimer = 0; // consume the grace window
            jumpHoldTimer = JUMP_HOLD_MAX; // start the hold window
        }

        // Variable jump height — apply additional upward force while the jump
        // button is held and the hold window hasn't expired.
        if (jump.down && jumpHoldTimer > 0) {
            body.applyForce(0, JUMP_HOLD_FORCE, 0);
            jumpHoldTimer = Math.max(0, jumpHoldTimer - dt);
        } else {
            jumpHoldTimer = 0; // button released early — kill the window
        }

        prevGrounded = grounded;

        // Death plane respawn
        if (pos.y < props.deathPlaneY) {
            transform.localPosition.set(...props.respawnState.position);
            body.setLinearVelocity(0, 0, 0);
            jumpLock = false;
            coyoteTimer = 0;
            jumpHoldTimer = 0;
            dashTimer = 0;
            dashCooldown = 0;
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
