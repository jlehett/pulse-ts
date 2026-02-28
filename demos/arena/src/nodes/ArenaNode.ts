import { useProvideContext, useChild } from '@pulse-ts/core';
import { useAmbientLight, useDirectionalLight, useFog } from '@pulse-ts/three';
import { installParticles } from '@pulse-ts/effects';
import { useMemory, useRoom, type MemoryHub } from '@pulse-ts/network';
import {
    GameCtx,
    PlayerIdCtx,
    LocalPlayerNodeCtx,
    type GameState,
} from '../contexts';
import { PlatformNode } from './PlatformNode';
import { LocalPlayerNode } from './LocalPlayerNode';
import { RemotePlayerNode } from './RemotePlayerNode';
import { GameManagerNode } from './GameManagerNode';
import { ScoreHudNode } from './ScoreHudNode';
import { KnockoutOverlayNode } from './KnockoutOverlayNode';
import { CountdownOverlayNode } from './CountdownOverlayNode';
import { MatchOverOverlayNode } from './MatchOverOverlayNode';
import { CameraRigNode } from './CameraRigNode';

export interface ArenaNodeProps {
    playerId: number;
    hub: MemoryHub;
}

/**
 * Top-level orchestrator node for the arena demo.
 * Sets up lighting, fog, shared contexts, and particle pools.
 * Each world instance mounts its own ArenaNode with a different playerId.
 */
export function ArenaNode({ playerId, hub }: ArenaNodeProps) {
    // Network — connect to shared hub and join arena room
    useMemory(hub, { peerId: `player-${playerId}` });
    useRoom('arena');

    // Lighting — overhead sun with shadows covering the circular arena
    useAmbientLight({ color: 0xb0c4de, intensity: 0.4 });
    useDirectionalLight({
        color: 0xffffff,
        intensity: 1.0,
        position: [0, 20, 10],
        castShadow: true,
        shadowMapSize: 1024,
        shadowBounds: {
            near: 0.5,
            far: 60,
            left: -15,
            right: 15,
            top: 15,
            bottom: -15,
        },
    });

    // Fog for depth and atmosphere
    useFog({ color: 0x0a0a1a, near: 30, far: 60 });

    // Shared game state
    const gameState: GameState = {
        scores: [0, 0],
        round: 1,
        phase: 'playing',
        lastKnockedOut: -1,
        countdownValue: -1,
        matchWinner: -1,
    };
    useProvideContext(GameCtx, gameState);
    useProvideContext(PlayerIdCtx, playerId);

    // Particle effects pool
    installParticles({ maxPerPool: 200, defaultSize: 0.08 });

    // Arena platform
    useChild(PlatformNode);

    // Local player
    const playerNode = useChild(LocalPlayerNode);
    useProvideContext(LocalPlayerNodeCtx, playerNode);

    // Remote player — replicated from the other world
    const remoteId = 1 - playerId;
    useChild(RemotePlayerNode, { remotePlayerId: remoteId });

    // Game manager — tracks knockout scores
    useChild(GameManagerNode);

    // Score HUD
    useChild(ScoreHudNode);

    // Round lifecycle overlays
    useChild(KnockoutOverlayNode);
    useChild(CountdownOverlayNode);
    useChild(MatchOverOverlayNode);

    // Camera rig — follows local player
    useChild(CameraRigNode);
}
