import * as THREE from 'three';
import {
    useComponent,
    useNode,
    useFixedEarly,
    useFixedUpdate,
    useFrameUpdate,
    useWorld,
    Transform,
    Vec3,
} from '@pulse-ts/core';
import { useAction, useAxis2D } from '@pulse-ts/input';
import {
    useRigidBody,
    useCapsuleCollider,
    usePhysicsRaycast,
} from '@pulse-ts/physics';
import { useThreeRoot, useObject3D } from '@pulse-ts/three';

const MOVE_SPEED = 8;
const JUMP_IMPULSE = 8;
const GROUND_RAY_DIST = 1.15;
const PLAYER_RADIUS = 0.3;
const PLAYER_HALF_HEIGHT = 0.4;

export interface PlayerNodeProps {
    spawn: [number, number, number];
    deathPlaneY: number;
}

export function PlayerNode(props: Readonly<PlayerNodeProps>) {
    const node = useNode();
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

    useFixedUpdate(() => {
        const move = getMove();
        const jump = getJump();

        // Ground check via downward raycast from player center
        const pos = transform.localPosition;
        rayOrigin.set(pos.x, pos.y, pos.z);
        const hit = raycast(rayOrigin, rayDir, GROUND_RAY_DIST, (c) => c.owner !== node);
        const grounded = hit !== null;

        // Release the jump lock once the player has actually left the ground.
        if (!grounded) jumpLock = false;

        // Horizontal movement — set velocity directly for tight control
        const vx = move.x * MOVE_SPEED;
        const vz = -move.y * MOVE_SPEED; // W = forward = -Z
        const vy = body.linearVelocity.y;
        body.setLinearVelocity(vx, vy, vz);

        // Jump — guard with jumpLock so rapid presses can't trigger a second
        // impulse while the player is still within raycast range of the ground.
        if (jump.pressed && grounded && !jumpLock) {
            body.applyImpulse(0, JUMP_IMPULSE, 0);
            jumpLock = true;
        }

        // Death plane respawn
        if (pos.y < props.deathPlaneY) {
            transform.localPosition.set(...props.spawn);
            body.setLinearVelocity(0, 0, 0);
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
