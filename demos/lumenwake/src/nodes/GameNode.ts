import { useProvideContext } from '@pulse-ts/core';
import { useAmbientLight } from '@pulse-ts/three';
import type { Transport } from '@pulse-ts/network';
import { useConnection } from '@pulse-ts/network';
import { installParticles } from '@pulse-ts/effects';
import { GameCtx, type GameState } from '../contexts';
import { CameraNode } from './CameraNode';

export interface GameNodeProps {
    playerCount: number;
    playerId?: number;
    transport?: Transport;
    isHost?: boolean;
    onRequestMenu?: () => void;
}

/**
 * Top-level orchestrator node for Lumenwake.
 * Sets up lighting, camera, networking, and shared game context.
 */
export function GameNode(props?: Readonly<GameNodeProps>) {
    const online = props?.transport != null && props?.playerId != null;

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
}
