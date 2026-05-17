import * as THREE from 'three';
import {
    useFrameUpdate,
    useService,
    useContext,
    useCooldown,
} from '@pulse-ts/core';
import { useMesh } from '@pulse-ts/three';
import { ThreeService } from '@pulse-ts/three';
import { useParticles } from '@pulse-ts/effects';
import { useAxis2D, useAction, usePointer } from '@pulse-ts/input';
import { GameCtx } from '../../contexts';
import type { ClassDef } from '../../config/classes';
import { PLAYER_COLORS } from '../../config/classes';
import {
    moveSpherePosition,
    orientOnSphere,
    raycastSphere,
    geodesicDirection,
    projectToTangent,
} from '../../utils/sphereMovement';

export interface LocalPlayerProps {
    classDef: ClassDef;
    playerIndex: number;
    sphereRadius: number;
    startPosition: THREE.Vector3;
    getScreenAxes?: () => { right: THREE.Vector3; up: THREE.Vector3 };
    onShoot?: (origin: THREE.Vector3, direction: THREE.Vector3) => void;
    onPositionUpdate?: (
        position: THREE.Vector3,
        forward: THREE.Vector3,
    ) => void;
}

export interface PlayerState {
    health: number;
    maxHealth: number;
    alive: boolean;
    position: THREE.Vector3;
    forward: THREE.Vector3;
    invulnerable: boolean;
    invulnerableTimer: number;
    dashTimer: number;
    dashDirection: THREE.Vector3;
}

/**
 * Local player node — handles input, sphere-surface movement,
 * aiming via mouse raycast, and primary fire.
 */
export function LocalPlayerNode(props: LocalPlayerProps) {
    const { classDef, playerIndex, sphereRadius, startPosition } = props;
    const three = useService(ThreeService);
    useContext(GameCtx);
    const color = PLAYER_COLORS[playerIndex % PLAYER_COLORS.length];

    // Mesh setup based on class shape
    const meshType =
        classDef.shape === 'cube'
            ? ('box' as const)
            : classDef.shape === 'octahedron'
              ? ('octahedron' as const)
              : ('icosahedron' as const);

    const meshOpts =
        meshType === 'box'
            ? {
                  size: [
                      classDef.radius * 1.6,
                      classDef.radius * 1.6,
                      classDef.radius * 1.6,
                  ] as [number, number, number],
                  color,
                  emissive: color,
                  emissiveIntensity: 1.2,
                  roughness: 0.2,
                  metalness: 0.8,
              }
            : {
                  radius: classDef.radius,
                  color,
                  emissive: color,
                  emissiveIntensity: 1.2,
                  roughness: 0.2,
                  metalness: 0.8,
              };

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
        invulnerable: false,
        invulnerableTimer: 0,
        dashTimer: 0,
        dashDirection: new THREE.Vector3(),
    };

    // Cooldowns
    const fireCooldown = useCooldown(1 / classDef.primaryFireRate);
    const ability1Cooldown = useCooldown(classDef.ability1.cooldown);
    const ability2Cooldown = useCooldown(classDef.ability2.cooldown);

    // Lumenwake trail — glowing particles left on the sphere surface
    const trailColor = new THREE.Color(color);
    const trail = useParticles({
        maxCount: 128,
        size: 0.12,
        blending: 'additive',
        init: (p) => {
            p.lifetime = 0.8;
            p.velocity.x = 0;
            p.velocity.y = 0;
            p.velocity.z = 0;
            p.color.r = trailColor.r;
            p.color.g = trailColor.g;
            p.color.b = trailColor.b;
            p.opacity = 0.7;
        },
        update: (p) => {
            p.opacity = 0.7 * (1 - p.age / p.lifetime);
            p.size = 0.12 * (1 - (p.age / p.lifetime) * 0.5);
        },
    });
    let trailAccumulator = 0;
    const TRAIL_RATE = 30; // particles per second while moving

    useFrameUpdate((dt) => {
        if (!state.alive) return;

        // Movement input → screen-relative velocity projected onto tangent plane
        const input = moveInput();
        velocity.set(0, 0, 0);
        if (input.x !== 0 || input.y !== 0) {
            const axes = props.getScreenAxes?.();
            if (axes) {
                // Project camera screen axes onto the sphere tangent plane
                const screenRight = axes.right.clone();
                projectToTangent(screenRight, position);
                const screenUp = axes.up.clone();
                projectToTangent(screenUp, position);

                if (screenRight.lengthSq() > 1e-6) screenRight.normalize();
                if (screenUp.lengthSq() > 1e-6) screenUp.normalize();

                velocity
                    .addScaledVector(screenRight, input.x)
                    .addScaledVector(screenUp, input.y);
            }
            if (velocity.lengthSq() > 0) {
                velocity.normalize().multiplyScalar(classDef.moveSpeed);
            }
        }

        // Move along sphere surface
        if (velocity.lengthSq() > 0) {
            moveSpherePosition(position, velocity, dt, sphereRadius);

            // Emit trail particles while moving
            trailAccumulator += TRAIL_RATE * dt;
            const toSpawn = Math.floor(trailAccumulator);
            trailAccumulator -= toSpawn;
            if (toSpawn > 0) {
                const n = position.clone().normalize();
                const trailPos = position
                    .clone()
                    .addScaledVector(n, classDef.radius * 0.3);
                trail.burst(toSpawn, [trailPos.x, trailPos.y, trailPos.z]);
            }
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

        // Ability 1
        const ab1 = ability1Action();
        if (ab1.pressed && ability1Cooldown.ready) {
            ability1Cooldown.trigger();
            if (classDef.id === 'shard') {
                // Piercing Beam — fast long-range projectile
                props.onShoot?.(position.clone(), forward.clone());
            } else if (classDef.id === 'lens') {
                // Prism Split — 3-way spread
                const spreadAngle = Math.PI / 8;
                const up = position.clone().normalize();
                for (let i = -1; i <= 1; i++) {
                    const dir = forward.clone();
                    if (i !== 0) {
                        dir.applyAxisAngle(up, spreadAngle * i);
                    }
                    props.onShoot?.(position.clone(), dir);
                }
            }
            // Ward: Light Barrier — grant brief invulnerability
            if (classDef.id === 'ward') {
                state.invulnerable = true;
                state.invulnerableTimer = 2.0;
            }
        }

        // Ability 2
        const ab2 = ability2Action();
        if (ab2.pressed && ability2Cooldown.ready) {
            ability2Cooldown.trigger();
            if (classDef.id === 'shard') {
                // Photon Dash — burst forward
                state.dashTimer = 0.2;
                state.dashDirection = forward.clone();
            } else if (classDef.id === 'ward') {
                // Sanctuary — heal self
                state.health = Math.min(state.maxHealth, state.health + 40);
            }
            // Lens: Slow Field — will affect enemies when enemy system exists
        }

        // Process active ability states
        if (state.dashTimer > 0) {
            const dashSpeed = classDef.moveSpeed * 3;
            const dashVel = state.dashDirection
                .clone()
                .multiplyScalar(dashSpeed);
            moveSpherePosition(position, dashVel, dt, sphereRadius);
            state.dashTimer -= dt;
        }
        if (state.invulnerable) {
            state.invulnerableTimer -= dt;
            if (state.invulnerableTimer <= 0) {
                state.invulnerable = false;
            }
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
            if (state.invulnerable) return;
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
