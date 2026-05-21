import * as THREE from 'three';
import { useFrameUpdate, useWorld, useNode } from '@pulse-ts/core';
import { useParticleBurst } from '@pulse-ts/effects';
import type { EnemyDef } from '../../config/enemies';
import { EnemyNode, type EnemyHandle } from './EnemyNode';
import type { MapConfig } from '../../config/maps';
import { sphereToWorld } from '../../config/maps';
import { geodesicDirection } from '../../utils/sphereMovement';

const CONTACT_DAMAGE_COOLDOWN = 0.5;

export type { EnemyHandle } from './EnemyNode';

export interface EnemySpawnerProps {
    map: MapConfig;
    glowTexture: THREE.Texture;
    sunDir: THREE.Vector3;
    sunColor: THREE.Color;
    getSunStrength: () => number;
    playerRadius: number;
    getDarknessLevel: () => number;
    getPlayerPositions: () => THREE.Vector3[];
    onContactDamage?: (damage: number, enemyPosition: THREE.Vector3) => void;
    onEnemyDeath?: (position: THREE.Vector3, enemyDef: EnemyDef) => void;
}

/**
 * Manages enemy spawning, lifetime, and death effects.
 * Spawns enemies at configured spawn points on a timer,
 * cycling through enemy types.
 */
export function EnemySpawnerNode(props: EnemySpawnerProps) {
    const { map } = props;
    const world = useWorld();
    const parentNode = useNode();

    const enemies: EnemyHandle[] = [];
    let contactDamageCooldown = 0;

    const deathBurst = useParticleBurst({
        count: 24,
        lifetime: 0.8,
        color: 0x331144,
        speed: [3, 8],
        gravity: 2,
        size: 0.12,
        shrink: true,
        opacity: 0.9,
        blending: 'additive',
    });

    let spawnPointIndex = 0;

    function spawnEnemy(enemyDef: EnemyDef) {
        const spawnPoints = map.enemySpawns;
        const point = spawnPoints[spawnPointIndex % spawnPoints.length];
        spawnPointIndex++;

        const pos = sphereToWorld(point.coord, map.sphereRadius);
        const startPosition = new THREE.Vector3(pos[0], pos[1], pos[2]);

        let handle: EnemyHandle | null = null;

        world.mount(
            EnemyNode,
            {
                enemyDef,
                sphereRadius: map.sphereRadius,
                startPosition,
                glowTexture: props.glowTexture,
                sunDir: props.sunDir,
                sunColor: props.sunColor,
                getSunStrength: props.getSunStrength,
                getDarknessLevel: props.getDarknessLevel,
                getPlayerPositions: props.getPlayerPositions,
                onReady: (h) => {
                    handle = h;
                    enemies.push(h);
                },
                onDeath: (deathPos: THREE.Vector3, deadDef: EnemyDef) => {
                    deathBurst([deathPos.x, deathPos.y, deathPos.z]);
                    if (handle) {
                        const idx = enemies.indexOf(handle);
                        if (idx >= 0) enemies.splice(idx, 1);
                    }
                    props.onEnemyDeath?.(deathPos, deadDef);
                },
            },
            { parent: parentNode },
        );
    }

    useFrameUpdate((dt) => {
        // Contact damage check
        contactDamageCooldown = Math.max(0, contactDamageCooldown - dt);
        if (contactDamageCooldown <= 0) {
            const players = props.getPlayerPositions();
            for (const enemy of enemies) {
                if (!enemy.state.alive || enemy.state.spawning) continue;
                for (const playerPos of players) {
                    let hit = false;
                    const pn = playerPos.clone().normalize();

                    // Check shield collision first
                    if (enemy.state.shieldPosition) {
                        const sn = enemy.state.shieldPosition
                            .clone()
                            .normalize();
                        const shieldCos = pn.dot(sn);
                        const shieldArcDist =
                            Math.acos(Math.min(1, Math.max(-1, shieldCos))) *
                            map.sphereRadius;
                        if (
                            shieldArcDist <
                            enemy.state.shieldRadius * 0.6 + props.playerRadius
                        ) {
                            hit = true;
                        }
                    }

                    // Check body collision
                    if (!hit) {
                        const en = enemy.state.position.clone().normalize();
                        const cosAngle = pn.dot(en);
                        const arcDist =
                            Math.acos(Math.min(1, Math.max(-1, cosAngle))) *
                            map.sphereRadius;
                        const contactRange =
                            enemy.state.enemyDef.radius + props.playerRadius;
                        if (arcDist < contactRange) {
                            hit = true;
                        }
                    }

                    if (hit) {
                        props.onContactDamage?.(
                            enemy.state.enemyDef.contactDamage,
                            enemy.state.position,
                        );
                        const knockDir = geodesicDirection(
                            playerPos,
                            enemy.state.position,
                        );
                        enemy.applyKnockback(
                            knockDir,
                            enemy.state.enemyDef.moveSpeed * 4,
                        );
                        contactDamageCooldown = CONTACT_DAMAGE_COOLDOWN;
                        break;
                    }
                }
                if (contactDamageCooldown > 0) break;
            }
        }
    });

    return {
        getEnemies(): EnemyHandle[] {
            return enemies;
        },
        spawnEnemy,
        getAliveCount(): number {
            return enemies.filter((e) => e.state.alive).length;
        },
    };
}
