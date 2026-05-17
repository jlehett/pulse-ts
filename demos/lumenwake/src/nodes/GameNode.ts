import { useProvideContext, useChild } from '@pulse-ts/core';
import { useAmbientLight } from '@pulse-ts/three';
import type { Transport } from '@pulse-ts/network';
import { useConnection } from '@pulse-ts/network';
import { installParticles } from '@pulse-ts/effects';
import { GameCtx, type GameState } from '../contexts';
import { CameraNode } from './CameraNode';
import { ArenaNode } from './arena/ArenaNode';
import type { MapConfig } from '../config/maps';
import { MAP_NEXUS } from '../config/maps';

export interface GameNodeProps {
    playerCount: number;
    playerId?: number;
    transport?: Transport;
    isHost?: boolean;
    map?: MapConfig;
    onRequestMenu?: () => void;
}

/**
 * Top-level orchestrator node for Lumenwake.
 * Sets up lighting, camera, networking, arena, and shared game context.
 */
export function GameNode(props?: Readonly<GameNodeProps>) {
    const online = props?.transport != null && props?.playerId != null;
    const map = props?.map ?? MAP_NEXUS;

    if (online) {
        useConnection(props!.transport!, { disconnectOnCleanup: false });
    }

    const gameState: GameState = {
        phase: 'playing',
        wave: 0,
        playerCount: props?.playerCount ?? 1,
        isHost: props?.isHost ?? true,
    };

    useProvideContext(GameCtx, gameState);

    installParticles({ maxPerPool: 4096 });

    useAmbientLight({ color: 0x2233aa, intensity: 0.3 });

    CameraNode();
    useChild(ArenaNode, { map });
}
