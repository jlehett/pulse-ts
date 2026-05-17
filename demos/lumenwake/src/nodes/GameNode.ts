import * as THREE from 'three';
import { useProvideContext, useChild, useWorld, useNode } from '@pulse-ts/core';
import { useAmbientLight } from '@pulse-ts/three';
import type { Transport } from '@pulse-ts/network';
import { useConnection } from '@pulse-ts/network';
import { installParticles } from '@pulse-ts/effects';
import { GameCtx, type GameState } from '../contexts';
import { CameraNode } from './CameraNode';
import { ArenaNode } from './arena/ArenaNode';
import { LocalPlayerNode } from './player/LocalPlayerNode';
import { ProjectileNode } from './player/ProjectileNode';
import type { MapConfig } from '../config/maps';
import { MAP_NEXUS, sphereToWorld } from '../config/maps';
import { CLASS_SHARD, PLAYER_COLORS } from '../config/classes';
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
    const map = props?.map ?? MAP_NEXUS;
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

    // Set up player color for the planetoid shader
    const playerColor = new THREE.Color(
        PLAYER_COLORS[playerIndex % PLAYER_COLORS.length],
    );
    planetoid.setPlayerCount(1);
    planetoid.setPlayerColor(0, playerColor);

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

    useChild(LocalPlayerNode, {
        classDef,
        playerIndex,
        sphereRadius: map.sphereRadius,
        startPosition,
        getScreenAxes: () => ({
            right: camera.getScreenRight(),
            up: camera.getScreenUp(),
        }),
        onShoot: (origin, direction) => {
            world.mount(
                ProjectileNode,
                {
                    origin,
                    direction,
                    speed: classDef.projectileSpeed,
                    damage: classDef.primaryDamage,
                    color: PLAYER_COLORS[playerIndex % PLAYER_COLORS.length],
                    sphereRadius: map.sphereRadius,
                },
                { parent: parentNode },
            );
        },
        onPositionUpdate: (position) => {
            camera.setPlayerTransform(position);
            planetoid.setPlayerPosition(0, position.x, position.y, position.z);
            planetoid.addTrailPoint(
                position.x,
                position.y,
                position.z,
                playerColor,
            );
        },
    });
}
