import * as THREE from 'three';
import { useFrameUpdate, useWorld, useNode } from '@pulse-ts/core';
import { useParticleBurst } from '@pulse-ts/effects';
import type { EnemyDef } from '../../config/enemies';
import { ALL_ENEMIES } from '../../config/enemies';
import { EnemyNode, type EnemyHandle } from './EnemyNode';
import type { MapConfig, SpawnPoint } from '../../config/maps';
import { sphereToWorld } from '../../config/maps';

const SPAWN_INTERVAL = 3.0;
const MAX_ENEMIES = 20;
const CONTACT_DAMAGE_COOLDOWN = 0.5;

export type { EnemyHandle } from './EnemyNode';

export interface EnemySpawnerProps {
    map: MapConfig;
    getPlayerPositions: () => THREE.Vector3[];
    onContactDamage?: (damage: number) => void;
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
    let spawnTimer = 1.0;
    let spawnIndex = 0;
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

    function spawnEnemy(spawnPoint: SpawnPoint, enemyDef: EnemyDef) {
        const pos = sphereToWorld(spawnPoint.coord, map.sphereRadius);
        const startPosition = new THREE.Vector3(pos[0], pos[1], pos[2]);

        let handle: EnemyHandle | null = null;

        world.mount(
            EnemyNode,
            {
                enemyDef,
                sphereRadius: map.sphereRadius,
                startPosition,
                getPlayerPositions: props.getPlayerPositions,
                onReady: (h) => {
                    handle = h;
                    enemies.push(h);
                },
                onDeath: (deathPos: THREE.Vector3) => {
                    deathBurst([deathPos.x, deathPos.y, deathPos.z]);
                    if (handle) {
                        const idx = enemies.indexOf(handle);
                        if (idx >= 0) enemies.splice(idx, 1);
                    }
                },
            },
            { parent: parentNode },
        );
    }

    useFrameUpdate((dt) => {
        // Spawn timer
        spawnTimer -= dt;
        if (spawnTimer <= 0 && enemies.length < MAX_ENEMIES) {
            spawnTimer = SPAWN_INTERVAL;

            const spawnPoints = map.enemySpawns;
            const point = spawnPoints[spawnIndex % spawnPoints.length];
            const enemyDef = ALL_ENEMIES[spawnIndex % ALL_ENEMIES.length];
            spawnIndex++;

            spawnEnemy(point, enemyDef);
        }

        // Contact damage check
        contactDamageCooldown = Math.max(0, contactDamageCooldown - dt);
        if (contactDamageCooldown <= 0) {
            const players = props.getPlayerPositions();
            for (const enemy of enemies) {
                if (!enemy.state.alive) continue;
                for (const playerPos of players) {
                    const cosAngle = enemy.state.position
                        .clone()
                        .normalize()
                        .dot(playerPos.clone().normalize());
                    const arcDist =
                        Math.acos(Math.min(1, Math.max(-1, cosAngle))) *
                        map.sphereRadius;
                    const contactRange = enemy.state.enemyDef.radius + 0.6;
                    if (arcDist < contactRange) {
                        props.onContactDamage?.(
                            enemy.state.enemyDef.contactDamage,
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
    };
}
