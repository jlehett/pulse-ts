import * as THREE from 'three';
import {
    useComponent,
    useNode,
    useFixedUpdate,
    useFrameUpdate,
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
const JUMP_IMPULSE = 5;
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

    const getMove = useAxis2D('move');
    const getJump = useAction('jump');
    const raycast = usePhysicsRaycast();

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

        // Horizontal movement — set velocity directly for tight control
        const vx = move.x * MOVE_SPEED;
        const vz = -move.y * MOVE_SPEED; // W = forward = -Z
        const vy = body.linearVelocity.y;
        body.setLinearVelocity(vx, vy, vz);

        // Jump
        if (jump.pressed && grounded) {
            body.applyImpulse(0, JUMP_IMPULSE, 0);
        }

        // Death plane respawn
        if (pos.y < props.deathPlaneY) {
            transform.localPosition.set(...props.spawn);
            body.setLinearVelocity(0, 0, 0);
        }
    });

    // Sync Three.js root position each frame (TRSSyncSystem handles this,
    // but we set the root position explicitly here for interpolation feel)
    useFrameUpdate(() => {
        root.position.set(
            transform.localPosition.x,
            transform.localPosition.y,
            transform.localPosition.z,
        );
    });
}
