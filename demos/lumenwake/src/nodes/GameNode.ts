import * as THREE from 'three';
import { useProvideContext, useChild, useWorld, useNode } from '@pulse-ts/core';
import { useAmbientLight } from '@pulse-ts/three';
import type { Transport } from '@pulse-ts/network';
import { useConnection } from '@pulse-ts/network';
import { installParticles } from '@pulse-ts/effects';
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
import type { MapConfig } from '../config/maps';
import { DEFAULT_MAP, sphereToWorld } from '../config/maps';
import { CLASS_SHARD } from '../config/classes';
import type { ClassDef } from '../config/classes';

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
 * Sets up lighting, camera, networking, planetoid arena, player, and shared game context.
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

    // Use class color for player and projectiles
    const classColor = new THREE.Color(classDef.color);
    planetoid.setPlayerCount(1);
    planetoid.setPlayerColor(0, classColor);

    // Get world and parent node for dynamic spawning
    const world = useWorld();
    const parentNode = useNode();

    // Spawn local player at their spawn point
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

    useChild(HudNode, { playerState, classDef });

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
            world.mount(
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
                },
                { parent: parentNode },
            );
        },
        onChargedShot: (origin, direction, charge) => {
            const chargeScale = 1 + charge * 2;
            const trailIntensity = 1 + charge * 3;
            world.mount(
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
                        planetoid.addProjectileTrailPoint(
                            pos.x,
                            pos.y,
                            pos.z,
                            classColor,
                            trailIntensity,
                        );
                    },
                },
                { parent: parentNode },
            );
        },
        onShoot: (origin, direction) => {
            world.mount(
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
                        planetoid.addProjectileTrailPoint(
                            pos.x,
                            pos.y,
                            pos.z,
                            classColor,
                        );
                    },
                },
                { parent: parentNode },
            );
        },
        onBeam: (origin, direction) => {
            world.mount(
                PiercingBeamNode,
                {
                    origin,
                    direction,
                    speed: classDef.projectileSpeed * 2.5,
                    damage: classDef.primaryDamage * 4,
                    color: classDef.color,
                    sphereRadius: map.sphereRadius,
                    onPositionUpdate: (pos) => {
                        planetoid.addProjectileTrailPoint(
                            pos.x,
                            pos.y,
                            pos.z,
                            classColor,
                            1.4,
                        );
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
