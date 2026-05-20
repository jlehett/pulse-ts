import * as THREE from 'three';
import {
    useProvideContext,
    useChild,
    useWorld,
    useNode,
    useFrameUpdate,
} from '@pulse-ts/core';
import { Node } from '@pulse-ts/core';
import { useAmbientLight } from '@pulse-ts/three';
import type { Transport } from '@pulse-ts/network';
import { useConnection } from '@pulse-ts/network';
import { installParticles, useParticleBurst } from '@pulse-ts/effects';
import { GameCtx, type GameState } from '../contexts';
import { CameraNode } from './CameraNode';
import { ArenaNode } from './arena/ArenaNode';
import { LocalPlayerNode, type PlayerState } from './player/LocalPlayerNode';
import { HudNode } from './HudNode';
import { ProjectileNode } from './player/ProjectileNode';
import { PiercingBeamNode } from './player/PiercingBeamNode';
import { PulseNode } from './player/PulseNode';
import { SanctuaryNode } from './player/SanctuaryNode';
import { SlowFieldNode } from './player/SlowFieldNode';
import { EnemySpawnerNode } from './enemies/EnemySpawnerNode';
import { geodesicDirection } from '../utils/sphereMovement';
import type { MapConfig } from '../config/maps';
import { DEFAULT_MAP, sphereToWorld } from '../config/maps';
import { CLASS_SHARD } from '../config/classes';
import type { ClassDef } from '../config/classes';

interface ProjectileEntry {
    position: THREE.Vector3;
    damage: number;
    alive: boolean;
    piercing: boolean;
    isAoE: boolean;
    aoeRadius: number;
    shieldDamageMultiplier: number;
    hitEnemies: Set<object>;
    node: Node;
}

export interface GameNodeProps {
    playerCount: number;
    playerId?: number;
    transport?: Transport;
    isHost?: boolean;
    map?: MapConfig;
    classDef?: ClassDef;
    onRequestMenu?: () => void;
}

/**
 * Top-level orchestrator node for Lumenwake.
 * Sets up lighting, camera, networking, planetoid arena, player,
 * enemy spawner, projectile-enemy collision, and shared game context.
 */
export function GameNode(props?: Readonly<GameNodeProps>) {
    const online = props?.transport != null && props?.playerId != null;
    const map = props?.map ?? DEFAULT_MAP;
    const classDef = props?.classDef ?? CLASS_SHARD;
    const playerIndex = props?.playerId ?? 0;

    if (online) {
        useConnection(props!.transport!, { disconnectOnCleanup: false });
    }

    const gameState: GameState = {
        phase: 'playing',
        wave: 0,
        playerCount: props?.playerCount ?? 1,
        isHost: props?.isHost ?? true,
        map,
    };

    useProvideContext(GameCtx, gameState);

    installParticles({ maxPerPool: 4096 });

    useAmbientLight({ color: 0x112244, intensity: 0.4 });

    const camera = CameraNode({ sphereRadius: map.sphereRadius });
    const { planetoid } = ArenaNode({ map });

    const classColor = new THREE.Color(classDef.color);
    planetoid.setPlayerCount(1);
    planetoid.setPlayerColor(0, classColor);

    const world = useWorld();
    const parentNode = useNode();

    const hitSparks = useParticleBurst({
        count: 16,
        lifetime: 0.6,
        color: classDef.color,
        speed: [5, 12],
        gravity: 3,
        size: 0.4,
        shrink: true,
        opacity: 1.0,
        blending: 'additive',
    });

    // Player setup
    const spawnCoord = map.playerSpawns[playerIndex % map.playerSpawns.length];
    const spawnPos = sphereToWorld(spawnCoord, map.sphereRadius);
    const startPosition = new THREE.Vector3(
        spawnPos[0],
        spawnPos[1],
        spawnPos[2],
    );

    const DAMAGE_FLASH_DURATION = 0.3;
    const playerState: PlayerState = {
        health: classDef.maxHealth,
        maxHealth: classDef.maxHealth,
        alive: true,
        position: new THREE.Vector3(),
        forward: new THREE.Vector3(0, 0, 1),
        invulnerable: false,
        invulnerableTimer: 0,
        barrierPosition: null,
        dashTimer: 0,
        dashDirection: new THREE.Vector3(),
        ability1Cooldown: null,
        ability2Cooldown: null,
        damageFlash: 0,
    };

    // Projectile registry for collision detection
    const projectiles: ProjectileEntry[] = [];

    function registerProjectile(
        node: Node,
        damage: number,
        opts?: {
            piercing?: boolean;
            isAoE?: boolean;
            aoeRadius?: number;
            shieldDamageMultiplier?: number;
        },
    ): ProjectileEntry {
        const entry: ProjectileEntry = {
            position: new THREE.Vector3(),
            damage,
            alive: true,
            piercing: opts?.piercing ?? false,
            isAoE: opts?.isAoE ?? false,
            aoeRadius: opts?.aoeRadius ?? 0,
            shieldDamageMultiplier: opts?.shieldDamageMultiplier ?? 1,
            hitEnemies: new Set(),
            node,
        };
        projectiles.push(entry);
        return entry;
    }

    useChild(HudNode, { playerState, classDef });

    // Enemy spawner
    const spawner = EnemySpawnerNode({
        map,
        glowTexture: planetoid.glowTexture,
        playerRadius: classDef.radius,
        getDarknessLevel: () => planetoid.getDarknessLevel(),
        getPlayerPositions: () =>
            playerState.alive ? [playerState.position] : [],
        onContactDamage: (damage, enemyPosition) => {
            if (!playerState.alive) return;

            // Ward barrier — only blocks enemies on the shield side
            if (playerState.invulnerable && playerState.barrierPosition) {
                const toEnemy = geodesicDirection(
                    playerState.position,
                    enemyPosition,
                );
                const toBarrier = geodesicDirection(
                    playerState.position,
                    playerState.barrierPosition,
                );
                if (toEnemy.dot(toBarrier) > 0.3) return;
            }

            playerState.health = Math.max(0, playerState.health - damage);
            playerState.damageFlash = 1.0;
            if (playerState.health <= 0) {
                playerState.alive = false;
            }
        },
    });

    const _shieldBaseColor = new THREE.Color(0x6622aa);
    const _shieldDamageColor = new THREE.Color(0.9, 0.25, 0.35);
    const _shieldGlowColor = new THREE.Color();
    const _deathGlowColor = new THREE.Color(0.45, 0.48, 0.58);

    const SOFT_PUSH_RATE = 8.0;
    const PLAYER_COLLISION_RADIUS = classDef.radius;

    // Projectile-enemy collision detection + soft collisions
    useFrameUpdate((dt) => {
        // Damage flash decay
        if (playerState.damageFlash > 0) {
            playerState.damageFlash = Math.max(
                0,
                playerState.damageFlash - dt / DAMAGE_FLASH_DURATION,
            );
        }

        const enemies = spawner.getEnemies();

        // Clean up dead projectiles
        for (let i = projectiles.length - 1; i >= 0; i--) {
            if (!projectiles[i].alive) {
                projectiles.splice(i, 1);
            }
        }

        for (const proj of projectiles) {
            if (!proj.alive) continue;

            for (const enemy of enemies) {
                if (!enemy.state.alive || enemy.state.spawning) continue;
                if ((proj.piercing || proj.isAoE) && proj.hitEnemies.has(enemy))
                    continue;

                const pn = proj.position.clone().normalize();

                // Piercing projectiles pass through shields; others check shield first
                if (!proj.piercing && enemy.state.shieldPosition) {
                    const sn = enemy.state.shieldPosition.clone().normalize();
                    const shieldCos = pn.dot(sn);
                    const shieldArcDist =
                        Math.acos(Math.min(1, Math.max(-1, shieldCos))) *
                        map.sphereRadius;

                    if (shieldArcDist < enemy.state.shieldRadius) {
                        enemy.damageShield(
                            proj.damage * proj.shieldDamageMultiplier,
                        );
                        const sp =
                            enemy.state.shieldPosition ?? enemy.state.position;
                        planetoid.addImpactSplat(sp.x, sp.y, sp.z, classColor);
                        hitSparks([
                            proj.position.x,
                            proj.position.y,
                            proj.position.z,
                        ]);

                        if (!proj.isAoE) {
                            proj.alive = false;
                            world.remove(proj.node);
                            break;
                        }
                        continue;
                    }
                }

                const en = enemy.state.position.clone().normalize();
                const cosAngle = pn.dot(en);
                const arcDist =
                    Math.acos(Math.min(1, Math.max(-1, cosAngle))) *
                    map.sphereRadius;

                const hitRange = proj.isAoE
                    ? proj.aoeRadius
                    : enemy.state.enemyDef.radius + 0.5;

                if (arcDist < hitRange) {
                    enemy.takeDamage(proj.damage);
                    const hitPos = enemy.state.position;
                    planetoid.addImpactSplat(
                        hitPos.x,
                        hitPos.y,
                        hitPos.z,
                        classColor,
                    );
                    hitSparks([
                        proj.position.x,
                        proj.position.y,
                        proj.position.z,
                    ]);

                    if (proj.piercing || proj.isAoE) {
                        proj.hitEnemies.add(enemy);
                    } else {
                        proj.alive = false;
                        world.remove(proj.node);
                        break;
                    }
                }
            }
        }

        // Shield glow — active shields emit lumenwake on the surface below
        for (const enemy of enemies) {
            if (!enemy.state.alive || !enemy.state.shieldPosition) continue;
            const sp = enemy.state.shieldPosition;
            const surfacePos = sp
                .clone()
                .normalize()
                .multiplyScalar(map.sphereRadius);
            const healthRatio =
                enemy.state.shieldMaxHealth > 0
                    ? enemy.state.shieldHealth / enemy.state.shieldMaxHealth
                    : 1;
            _shieldGlowColor
                .copy(_shieldBaseColor)
                .lerp(_shieldDamageColor, 1 - healthRatio);
            planetoid.addProjectileTrailPoint(
                surfacePos.x,
                surfacePos.y,
                surfacePos.z,
                _shieldGlowColor,
                1.5,
            );
        }

        // Soft collisions — enemy-enemy
        for (let i = 0; i < enemies.length; i++) {
            const a = enemies[i];
            if (!a.state.alive || a.state.spawning) continue;
            for (let j = i + 1; j < enemies.length; j++) {
                const b = enemies[j];
                if (!b.state.alive || b.state.spawning) continue;

                const minDist =
                    a.state.enemyDef.radius + b.state.enemyDef.radius + 0.3;
                const an = a.state.position.clone().normalize();
                const bn = b.state.position.clone().normalize();
                const cosAngle = an.dot(bn);
                const arcDist =
                    Math.acos(Math.min(1, Math.max(-1, cosAngle))) *
                    map.sphereRadius;

                if (arcDist < minDist && arcDist > 0.01) {
                    const push =
                        (minDist - arcDist) * SOFT_PUSH_RATE * dt * 0.5;
                    const dir = geodesicDirection(
                        a.state.position,
                        b.state.position,
                    );
                    b.state.position.addScaledVector(dir, push);
                    b.state.position
                        .normalize()
                        .multiplyScalar(map.sphereRadius);
                    a.state.position.addScaledVector(dir, -push);
                    a.state.position
                        .normalize()
                        .multiplyScalar(map.sphereRadius);
                }
            }
        }

        // Soft collisions — enemy-player (body + shield + ward barrier)
        if (playerState.alive) {
            for (const enemy of enemies) {
                if (!enemy.state.alive || enemy.state.spawning) continue;

                // Check if enemy is on the ward barrier side
                let blockedByBarrier = false;
                if (playerState.barrierPosition) {
                    const toEnemy = geodesicDirection(
                        playerState.position,
                        enemy.state.position,
                    );
                    const toBarrier = geodesicDirection(
                        playerState.position,
                        playerState.barrierPosition,
                    );
                    const onBarrierSide = toEnemy.dot(toBarrier) > 0.3;

                    if (onBarrierSide) {
                        const barrierHalfWidth = 0.3;

                        // Check enemy body vs barrier
                        const bn = playerState.barrierPosition
                            .clone()
                            .normalize();
                        const en2 = enemy.state.position.clone().normalize();
                        const bCos = bn.dot(en2);
                        const bArcDist =
                            Math.acos(Math.min(1, Math.max(-1, bCos))) *
                            map.sphereRadius;
                        const bMin =
                            barrierHalfWidth + enemy.state.enemyDef.radius;

                        if (bArcDist < bMin && bArcDist > 0.01) {
                            const knockDir = geodesicDirection(
                                playerState.barrierPosition,
                                enemy.state.position,
                            );
                            enemy.applyKnockback(
                                knockDir,
                                enemy.state.enemyDef.moveSpeed * 6,
                            );
                            const push =
                                (bMin - bArcDist) * SOFT_PUSH_RATE * 2 * dt;
                            enemy.state.position.addScaledVector(
                                knockDir,
                                push,
                            );
                            enemy.state.position
                                .normalize()
                                .multiplyScalar(map.sphereRadius);
                            blockedByBarrier = true;
                        }

                        // Check Nullcube shield vs barrier
                        if (!blockedByBarrier && enemy.state.shieldPosition) {
                            const sn = enemy.state.shieldPosition
                                .clone()
                                .normalize();
                            const sCos = bn.dot(sn);
                            const sArcDist =
                                Math.acos(Math.min(1, Math.max(-1, sCos))) *
                                map.sphereRadius;
                            const sMin =
                                barrierHalfWidth +
                                enemy.state.shieldRadius * 0.6;

                            if (sArcDist < sMin && sArcDist > 0.01) {
                                const knockDir = geodesicDirection(
                                    playerState.barrierPosition,
                                    enemy.state.position,
                                );
                                enemy.applyKnockback(
                                    knockDir,
                                    enemy.state.enemyDef.moveSpeed * 6,
                                );
                                const push =
                                    (sMin - sArcDist) * SOFT_PUSH_RATE * 2 * dt;
                                enemy.state.position.addScaledVector(
                                    knockDir,
                                    push,
                                );
                                enemy.state.position
                                    .normalize()
                                    .multiplyScalar(map.sphereRadius);
                                blockedByBarrier = true;
                            }
                        }
                    }
                }

                // Body collision — skip if barrier already handled this enemy
                if (!blockedByBarrier) {
                    const minDist =
                        enemy.state.enemyDef.radius + PLAYER_COLLISION_RADIUS;
                    const en = enemy.state.position.clone().normalize();
                    const pn = playerState.position.clone().normalize();
                    const cosAngle = en.dot(pn);
                    const arcDist =
                        Math.acos(Math.min(1, Math.max(-1, cosAngle))) *
                        map.sphereRadius;

                    if (arcDist < minDist && arcDist > 0.01) {
                        const push =
                            (minDist - arcDist) * SOFT_PUSH_RATE * dt * 0.5;
                        const dir = geodesicDirection(
                            enemy.state.position,
                            playerState.position,
                        );
                        playerState.position.addScaledVector(dir, push);
                        playerState.position
                            .normalize()
                            .multiplyScalar(map.sphereRadius);
                        enemy.state.position.addScaledVector(dir, -push);
                        enemy.state.position
                            .normalize()
                            .multiplyScalar(map.sphereRadius);
                    }
                }

                // Enemy shield collision — push player away from Nullcube shield
                if (enemy.state.shieldPosition) {
                    const shieldMin =
                        enemy.state.shieldRadius * 0.6 +
                        PLAYER_COLLISION_RADIUS;
                    const sn = enemy.state.shieldPosition.clone().normalize();
                    const spn = playerState.position.clone().normalize();
                    const shieldCos = sn.dot(spn);
                    const shieldArcDist =
                        Math.acos(Math.min(1, Math.max(-1, shieldCos))) *
                        map.sphereRadius;

                    if (shieldArcDist < shieldMin && shieldArcDist > 0.01) {
                        const push =
                            (shieldMin - shieldArcDist) *
                            SOFT_PUSH_RATE *
                            2 *
                            dt;
                        const dir = geodesicDirection(
                            enemy.state.shieldPosition,
                            playerState.position,
                        );
                        playerState.position.addScaledVector(dir, push);
                        playerState.position
                            .normalize()
                            .multiplyScalar(map.sphereRadius);
                    }
                }
            }
        }
    });

    useChild(LocalPlayerNode, {
        classDef,
        playerIndex,
        sphereRadius: map.sphereRadius,
        startPosition,
        playerState,
        getScreenAxes: () => ({
            right: camera.getScreenRight(),
            up: camera.getScreenUp(),
        }),
        onPulse: (origin) => {
            const entry = registerProjectile(null!, classDef.primaryDamage, {
                isAoE: true,
                aoeRadius: classDef.projectileVisual.radius * 20,
            });
            entry.position.copy(origin);
            entry.node = world.mount(
                PulseNode,
                {
                    origin,
                    maxRadius: classDef.projectileVisual.radius * 20,
                    damage: classDef.primaryDamage,
                    color: classDef.color,
                    sphereRadius: map.sphereRadius,
                    onPositionUpdate: (pos) => {
                        planetoid.addProjectileTrailPoint(
                            pos.x,
                            pos.y,
                            pos.z,
                            classColor,
                        );
                    },
                    onExpired: () => {
                        entry.alive = false;
                    },
                },
                { parent: parentNode },
            );
        },
        onChargedShot: (origin, direction, charge) => {
            const chargeScale = 1 + charge * 2;
            const trailIntensity = 1 + charge * 3;
            const entry = registerProjectile(
                null!,
                classDef.primaryDamage * chargeScale,
                { shieldDamageMultiplier: 1 + charge * 2 },
            );
            entry.node = world.mount(
                ProjectileNode,
                {
                    origin,
                    direction,
                    speed: classDef.projectileSpeed * (0.8 + charge * 0.7),
                    damage: classDef.primaryDamage * chargeScale,
                    color: classDef.color,
                    sphereRadius: map.sphereRadius,
                    meshRadius: classDef.projectileVisual.radius * chargeScale,
                    emissiveIntensity:
                        classDef.projectileVisual.emissiveIntensity *
                        (1 + charge * 2),
                    onPositionUpdate: (pos) => {
                        entry.position.copy(pos);
                        planetoid.addProjectileTrailPoint(
                            pos.x,
                            pos.y,
                            pos.z,
                            classColor,
                            trailIntensity,
                        );
                    },
                    onExpired: () => {
                        entry.alive = false;
                    },
                },
                { parent: parentNode },
            );
        },
        onShoot: (origin, direction) => {
            const entry = registerProjectile(null!, classDef.primaryDamage);
            entry.node = world.mount(
                ProjectileNode,
                {
                    origin,
                    direction,
                    speed: classDef.projectileSpeed,
                    damage: classDef.primaryDamage,
                    color: classDef.color,
                    sphereRadius: map.sphereRadius,
                    meshRadius: classDef.projectileVisual.radius,
                    emissiveIntensity:
                        classDef.projectileVisual.emissiveIntensity,
                    onPositionUpdate: (pos) => {
                        entry.position.copy(pos);
                        planetoid.addProjectileTrailPoint(
                            pos.x,
                            pos.y,
                            pos.z,
                            classColor,
                        );
                    },
                    onExpired: () => {
                        entry.alive = false;
                    },
                },
                { parent: parentNode },
            );
        },
        onBeam: (origin, direction) => {
            const entry = registerProjectile(
                null!,
                classDef.primaryDamage * 4,
                { piercing: true },
            );
            entry.node = world.mount(
                PiercingBeamNode,
                {
                    origin,
                    direction,
                    speed: classDef.projectileSpeed * 2.5,
                    damage: classDef.primaryDamage * 4,
                    color: classDef.color,
                    sphereRadius: map.sphereRadius,
                    onPositionUpdate: (pos) => {
                        entry.position.copy(pos);
                        planetoid.addProjectileTrailPoint(
                            pos.x,
                            pos.y,
                            pos.z,
                            classColor,
                            1.4,
                        );
                    },
                    onExpired: () => {
                        entry.alive = false;
                    },
                },
                { parent: parentNode },
            );
        },
        onSanctuary: (origin) => {
            world.mount(
                SanctuaryNode,
                {
                    origin,
                    color: classDef.color,
                    sphereRadius: map.sphereRadius,
                    playerState,
                },
                { parent: parentNode },
            );
        },
        onSlowField: (origin) => {
            world.mount(
                SlowFieldNode,
                {
                    origin,
                    color: classDef.color,
                    sphereRadius: map.sphereRadius,
                },
                { parent: parentNode },
            );
        },
        onDashTrail: (pos) => {
            planetoid.addProjectileTrailPoint(
                pos.x,
                pos.y,
                pos.z,
                classColor,
                2.0,
            );
        },
        onPositionUpdate: (position) => {
            camera.setPlayerTransform(position);
            if (playerState.alive) {
                planetoid.setPlayerCount(1);
                planetoid.setPlayerPosition(
                    0,
                    position.x,
                    position.y,
                    position.z,
                );
            } else {
                planetoid.setPlayerCount(0);
            }
            if (playerState.alive) {
                planetoid.addTrailPoint(
                    position.x,
                    position.y,
                    position.z,
                    classColor,
                );
            } else {
                const pulse =
                    1.0 + 1.5 * (0.5 + 0.5 * Math.sin(Date.now() * 0.0025));
                planetoid.addProjectileTrailPoint(
                    position.x,
                    position.y,
                    position.z,
                    _deathGlowColor,
                    pulse,
                );
            }
        },
    });
}
