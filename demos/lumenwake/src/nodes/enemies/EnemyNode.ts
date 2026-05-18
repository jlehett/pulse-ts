import * as THREE from 'three';
import { useFrameUpdate, useWorld, useNode } from '@pulse-ts/core';
import { useMesh } from '@pulse-ts/three';
import type { EnemyDef } from '../../config/enemies';
import {
    moveSpherePosition,
    geodesicDirection,
    orientOnSphere,
} from '../../utils/sphereMovement';

const HIT_FLASH_DURATION = 0.12;

export interface EnemyState {
    health: number;
    maxHealth: number;
    alive: boolean;
    position: THREE.Vector3;
    forward: THREE.Vector3;
    enemyDef: EnemyDef;
    /** Nullcube shield facing direction (unit tangent vector on sphere). */
    shieldDirection: THREE.Vector3;
}

export interface EnemyHandle {
    state: EnemyState;
    takeDamage: (amount: number, fromDirection?: THREE.Vector3) => void;
}

export interface EnemyNodeProps {
    enemyDef: EnemyDef;
    sphereRadius: number;
    startPosition: THREE.Vector3;
    getPlayerPositions: () => THREE.Vector3[];
    onReady?: (handle: EnemyHandle) => void;
    onDeath?: (position: THREE.Vector3, enemyDef: EnemyDef) => void;
}

/**
 * A single enemy (voidform) entity. Handles mesh rendering, sphere-surface
 * AI steering toward the nearest player, health, hit-flash, and death.
 */
export function EnemyNode(props: EnemyNodeProps) {
    const { enemyDef, sphereRadius, startPosition } = props;

    const world = useWorld();
    const node = useNode();

    const geometry = createGeometry(enemyDef);
    const { root, mesh, material } = useMesh('sphere', {
        radius: 1,
        color: enemyDef.color,
        emissive: enemyDef.emissiveColor,
        emissiveIntensity: 1.5,
        roughness: 0.7,
        metalness: 0.2,
    });

    // Replace the default sphere geometry with the correct enemy geometry
    mesh.geometry.dispose();
    mesh.geometry = geometry;

    const mat = material as THREE.MeshStandardMaterial;
    mat.toneMapped = false;

    const position = startPosition.clone();
    const forward = new THREE.Vector3(0, 0, 1);
    let hitFlashTimer = 0;
    let destroyed = false;

    const state: EnemyState = {
        health: enemyDef.health,
        maxHealth: enemyDef.health,
        alive: true,
        position,
        forward,
        enemyDef,
        shieldDirection: new THREE.Vector3(0, 0, 1),
    };

    // Initial placement
    root.position.copy(position);
    const initNormal = position.clone().normalize();
    root.position.addScaledVector(initNormal, enemyDef.radius);

    useFrameUpdate((dt) => {
        if (destroyed || !state.alive) return;

        // Find nearest player
        const players = props.getPlayerPositions();
        let nearestDist = Infinity;
        let nearestDir: THREE.Vector3 | null = null;

        for (const playerPos of players) {
            const dir = geodesicDirection(position, playerPos);
            if (dir.lengthSq() < 1e-6) continue;
            const cosAngle = position
                .clone()
                .normalize()
                .dot(playerPos.clone().normalize());
            const arcDist =
                Math.acos(Math.min(1, Math.max(-1, cosAngle))) * sphereRadius;
            if (arcDist < nearestDist) {
                nearestDist = arcDist;
                nearestDir = dir;
            }
        }

        // Steer toward nearest player
        if (nearestDir) {
            forward.lerp(nearestDir, Math.min(1, dt * 5));
            forward.normalize();
            state.shieldDirection.copy(forward);

            const velocity = forward.clone().multiplyScalar(enemyDef.moveSpeed);
            moveSpherePosition(position, velocity, dt, sphereRadius);
        }

        // Update visual
        const normal = position.clone().normalize();
        root.position.copy(position);
        root.position.addScaledVector(normal, enemyDef.radius);
        orientOnSphere(position, forward, root.quaternion);

        // Type-specific animation
        if (enemyDef.type === 'shard') {
            mesh.rotation.y += dt * 3.0;
            mesh.rotation.x += dt * 1.5;
        } else if (enemyDef.type === 'eclipser') {
            mesh.rotation.y += dt * 0.4;
            mesh.rotation.x += dt * 0.2;
        }

        // Hit flash decay
        if (hitFlashTimer > 0) {
            hitFlashTimer -= dt;
            const flash = hitFlashTimer / HIT_FLASH_DURATION;
            mat.emissiveIntensity = 1.5 + flash * 4.0;
            mat.emissive.set(enemyDef.emissiveColor);
            mat.emissive.lerp(new THREE.Color(0xffffff), flash * 0.8);
        } else {
            mat.emissiveIntensity = 1.5;
            mat.emissive.set(enemyDef.emissiveColor);
        }
    });

    function takeDamage(amount: number, fromDirection?: THREE.Vector3) {
        if (!state.alive || destroyed) return;

        // Nullcube shield check: absorb damage from the front face
        if (enemyDef.type === 'nullcube' && fromDirection) {
            const dot = fromDirection.dot(state.shieldDirection);
            // If the projectile is coming from the front (dot < 0 means
            // projectile direction opposes shield facing), absorb it
            if (dot < -0.3) {
                hitFlashTimer = HIT_FLASH_DURATION * 0.5;
                return;
            }
        }

        state.health -= amount;
        hitFlashTimer = HIT_FLASH_DURATION;

        if (state.health <= 0) {
            state.health = 0;
            state.alive = false;
            props.onDeath?.(position.clone(), enemyDef);
            destroyed = true;
            world.remove(node);
        }
    }

    props.onReady?.({ state, takeDamage });

    return { state, takeDamage };
}

function createGeometry(def: EnemyDef): THREE.BufferGeometry {
    switch (def.type) {
        case 'shard':
            return new THREE.TetrahedronGeometry(def.radius, 0);
        case 'nullcube':
            return new THREE.BoxGeometry(
                def.radius * 1.4,
                def.radius * 1.4,
                def.radius * 1.4,
            );
        case 'eclipser':
            return new THREE.DodecahedronGeometry(def.radius, 0);
    }
}
