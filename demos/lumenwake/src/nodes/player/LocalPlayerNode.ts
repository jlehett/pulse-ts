import * as THREE from 'three';
import {
    useFrameUpdate,
    useService,
    useContext,
    useCooldown,
} from '@pulse-ts/core';
import { useMesh } from '@pulse-ts/three';
import { ThreeService } from '@pulse-ts/three';
import { useAxis2D, useAction, usePointer } from '@pulse-ts/input';
import { GameCtx } from '../../contexts';
import type { ClassDef } from '../../config/classes';
import { PLAYER_COLORS } from '../../config/classes';
import {
    moveSpherePosition,
    getTangentFrame,
    orientOnSphere,
    raycastSphere,
    geodesicDirection,
} from '../../utils/sphereMovement';

export interface LocalPlayerProps {
    classDef: ClassDef;
    playerIndex: number;
    sphereRadius: number;
    startPosition: THREE.Vector3;
    onShoot?: (origin: THREE.Vector3, direction: THREE.Vector3) => void;
    onPositionUpdate?: (position: THREE.Vector3, forward: THREE.Vector3) => void;
}

export interface PlayerState {
    health: number;
    maxHealth: number;
    alive: boolean;
    position: THREE.Vector3;
    forward: THREE.Vector3;
}

/**
 * Local player node — handles input, sphere-surface movement,
 * aiming via mouse raycast, and primary fire.
 */
export function LocalPlayerNode(props: LocalPlayerProps) {
    const { classDef, playerIndex, sphereRadius, startPosition } = props;
    const three = useService(ThreeService);
    const game = useContext(GameCtx);
    const color = PLAYER_COLORS[playerIndex % PLAYER_COLORS.length];

    // Mesh setup based on class shape
    const meshType = classDef.shape === 'cube' ? 'box' as const :
        classDef.shape === 'octahedron' ? 'octahedron' as const :
        'icosahedron' as const;

    const meshOpts = meshType === 'box'
        ? { size: [classDef.radius * 1.6, classDef.radius * 1.6, classDef.radius * 1.6] as [number, number, number], color, emissive: color, emissiveIntensity: 1.2, roughness: 0.2, metalness: 0.8 }
        : { radius: classDef.radius, color, emissive: color, emissiveIntensity: 1.2, roughness: 0.2, metalness: 0.8 };

    const { root, mesh, material } = useMesh(meshType, meshOpts as any);

    // Disable tonemapping for bloom visibility
    (material as THREE.MeshStandardMaterial).toneMapped = false;

    // Position on sphere surface
    const position = startPosition.clone();
    const forward = new THREE.Vector3(0, 0, 1);
    const velocity = new THREE.Vector3();

    root.position.copy(position);

    // Input hooks
    const moveInput = useAxis2D('move');
    const fireAction = useAction('fire');
    const ability1Action = useAction('ability1');
    const ability2Action = useAction('ability2');
    const pointer = usePointer();

    // State
    const state: PlayerState = {
        health: classDef.maxHealth,
        maxHealth: classDef.maxHealth,
        alive: true,
        position,
        forward,
    };

    // Cooldowns
    const fireCooldown = useCooldown(1 / classDef.primaryFireRate);
    const ability1Cooldown = useCooldown(classDef.ability1.cooldown);
    const ability2Cooldown = useCooldown(classDef.ability2.cooldown);

    // Tangent frame at player position
    const frame = {
        forward: new THREE.Vector3(),
        right: new THREE.Vector3(),
        up: new THREE.Vector3(),
    };

    useFrameUpdate((dt) => {
        if (!state.alive) return;

        // Get tangent frame at current position
        getTangentFrame(position, frame);

        // Movement input → tangent velocity
        const input = moveInput();
        velocity.set(0, 0, 0);
        if (input.x !== 0 || input.y !== 0) {
            velocity
                .addScaledVector(frame.right, input.x)
                .addScaledVector(frame.forward, -input.y);
            velocity.normalize().multiplyScalar(classDef.moveSpeed);
        }

        // Move along sphere surface
        if (velocity.lengthSq() > 0) {
            moveSpherePosition(position, velocity, dt, sphereRadius);
        }

        // Aiming — raycast mouse position onto sphere
        const ptr = pointer();
        const canvas = three.renderer.domElement;
        const ndcX = (ptr.x / canvas.clientWidth) * 2 - 1;
        const ndcY = -(ptr.y / canvas.clientHeight) * 2 + 1;
        const aimPoint = raycastSphere(three.camera, ndcX, ndcY, sphereRadius);

        if (aimPoint) {
            const dir = geodesicDirection(position, aimPoint);
            if (dir.lengthSq() > 0) {
                forward.copy(dir);
            }
        }

        // Orient mesh on sphere surface
        orientOnSphere(position, forward, root.quaternion);
        root.position.copy(position);

        // Float above sphere surface slightly
        const normal = position.clone().normalize();
        root.position.addScaledVector(normal, classDef.radius * 0.8);

        // Spin the mesh for visual flair
        mesh.rotation.y += dt * 1.5;

        // Primary fire
        const fire = fireAction();
        if (fire.down && fireCooldown.ready) {
            fireCooldown.trigger();
            props.onShoot?.(position.clone(), forward.clone());
        }

        // Health-based glow
        const healthRatio = state.health / state.maxHealth;
        (material as THREE.MeshStandardMaterial).emissiveIntensity =
            0.4 + healthRatio * 0.8;

        // Report position for camera
        props.onPositionUpdate?.(position, forward);
    });

    return {
        state,
        takeDamage(amount: number) {
            state.health = Math.max(0, state.health - amount);
            if (state.health <= 0) {
                state.alive = false;
            }
        },
        heal(amount: number) {
            state.health = Math.min(state.maxHealth, state.health + amount);
        },
    };
}
