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

    const playerState: PlayerState = {
        health: classDef.maxHealth,
        maxHealth: classDef.maxHealth,
        alive: true,
        position: new THREE.Vector3(),
        forward: new THREE.Vector3(0, 0, 1),
        invulnerable: false,
        invulnerableTimer: 0,
        dashTimer: 0,
        dashDirection: new THREE.Vector3(),
        ability1Cooldown: null,
        ability2Cooldown: null,
    };

    // Projectile registry for collision detection
    const projectiles: ProjectileEntry[] = [];

    function registerProjectile(
        node: Node,
        damage: number,
        opts?: { piercing?: boolean; isAoE?: boolean; aoeRadius?: number },
    ): ProjectileEntry {
        const entry: ProjectileEntry = {
            position: new THREE.Vector3(),
            damage,
            alive: true,
            piercing: opts?.piercing ?? false,
            isAoE: opts?.isAoE ?? false,
            aoeRadius: opts?.aoeRadius ?? 0,
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
        getDarknessLevel: () => planetoid.getDarknessLevel(),
        getPlayerPositions: () =>
            playerState.alive ? [playerState.position] : [],
        onContactDamage: (damage) => {
            if (!playerState.alive || playerState.invulnerable) return;
            playerState.health = Math.max(0, playerState.health - damage);
            if (playerState.health <= 0) {
                playerState.alive = false;
            }
        },
    });

    // Projectile-enemy collision detection
    useFrameUpdate(() => {
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
                if (proj.piercing && proj.hitEnemies.has(enemy)) continue;

                const pn = proj.position.clone().normalize();
                const en = enemy.state.position.clone().normalize();
                const cosAngle = pn.dot(en);
                const arcDist =
                    Math.acos(Math.min(1, Math.max(-1, cosAngle))) *
                    map.sphereRadius;

                const hitRange = proj.isAoE
                    ? proj.aoeRadius
                    : enemy.state.enemyDef.radius + 0.5;

                if (arcDist < hitRange) {
                    const fromDir = geodesicDirection(
                        enemy.state.position,
                        proj.position,
                    );

                    enemy.takeDamage(proj.damage, fromDir);
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

                    if (proj.piercing) {
                        proj.hitEnemies.add(enemy);
                    } else if (!proj.isAoE) {
                        proj.alive = false;
                        world.remove(proj.node);
                        break;
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
            planetoid.setPlayerPosition(0, position.x, position.y, position.z);
            planetoid.addTrailPoint(
                position.x,
                position.y,
                position.z,
                classColor,
            );
        },
    });
}
