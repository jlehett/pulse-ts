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
const JUMP_IMPULSE = 8;
const GROUND_RAY_DIST = 1.15;
const PLAYER_RADIUS = 0.3;
const PLAYER_HALF_HEIGHT = 0.4;
const COYOTE_TIME = 0.12; // 120ms grace window after leaving ground

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

export interface PlayerNodeProps {
    spawn: [number, number, number];
    deathPlaneY: number;
    respawnState: RespawnState;
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
    const raycast = usePhysicsRaycast();

    // Prevents double-jumping: set true when a jump impulse is applied, cleared
    // only once the raycast returns null (player has physically left the ground).
    // Without this, rapid presses fire a second impulse on the next fixed step
    // before physics has had a chance to move the player upward.
    let jumpLock = false;
    let coyoteTimer = 0;

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

        // Ground check via downward raycast from player center
        const pos = transform.localPosition;
        rayOrigin.set(pos.x, pos.y, pos.z);
        const hit = raycast(rayOrigin, rayDir, GROUND_RAY_DIST, (c) => c.owner !== node);
        const grounded = hit !== null;

        // Release the jump lock once the player has actually left the ground.
        if (!grounded) jumpLock = false;

        // Coyote time: while grounded, keep the timer full; while airborne,
        // count it down so the player has a brief grace window to jump.
        if (grounded) {
            coyoteTimer = COYOTE_TIME;
        } else {
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

        // Horizontal movement — set velocity directly for tight control
        const vx = move.x * MOVE_SPEED + platformVx;
        const vz = -move.y * MOVE_SPEED + platformVz; // W = forward = -Z
        const vy = body.linearVelocity.y;
        body.setLinearVelocity(vx, vy, vz);

        // Jump — use coyoteTimer instead of grounded so the player can jump
        // briefly after walking off a ledge. jumpLock still prevents double-jumps.
        if (jump.pressed && coyoteTimer > 0 && !jumpLock) {
            body.applyImpulse(0, JUMP_IMPULSE, 0);
            jumpLock = true;
            coyoteTimer = 0; // consume the grace window
        }

        // Death plane respawn
        if (pos.y < props.deathPlaneY) {
            transform.localPosition.set(...props.respawnState.position);
            body.setLinearVelocity(0, 0, 0);
            jumpLock = false;
            coyoteTimer = 0;
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
