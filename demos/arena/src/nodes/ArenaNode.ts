import { useProvideContext, useChild } from '@pulse-ts/core';
import {
    useAmbientLight,
    useDirectionalLight,
    usePointLight,
    useFog,
} from '@pulse-ts/three';
import { useWebSocket, useRoom } from '@pulse-ts/network';
import { installParticles } from '@pulse-ts/effects';
import { GameCtx, type GameState } from '../contexts';
import { PlatformNode } from './PlatformNode';
import { LocalPlayerNode } from './LocalPlayerNode';
import { RemotePlayerNode } from './RemotePlayerNode';
import { GameManagerNode } from './GameManagerNode';
import { ScoreHudNode } from './ScoreHudNode';
import { KnockoutOverlayNode } from './KnockoutOverlayNode';
import { CountdownOverlayNode } from './CountdownOverlayNode';
import { MatchOverOverlayNode } from './MatchOverOverlayNode';
import { PauseMenuNode } from './PauseMenuNode';
import { DisconnectOverlayNode } from './DisconnectOverlayNode';
import { TouchControlsNode } from './TouchControlsNode';
import { CameraRigNode } from './CameraRigNode';
import { VictoryEffectNode } from './VictoryEffectNode';
import { ReplayNode } from './ReplayNode';

export interface ArenaNodeProps {
    /** Local player ID for online mode (0 or 1). Omit for local 2-player. */
    playerId?: number;
    /** WebSocket URL for online mode. Omit for local 2-player. */
    wsUrl?: string;
    /** Whether the local player is the host (online mode). */
    isHost?: boolean;
    /** Callback invoked when the player requests to return to the main menu. */
    onRequestMenu?: () => void;
}

/**
 * Top-level orchestrator node for the arena demo.
 * Sets up lighting, fog, shared contexts, and particle pools.
 *
 * In local mode (no props): mounts two local players in a single world.
 * In online mode (playerId + wsUrl): connects via WebSocket and mounts
 * one local player (producer) and one remote player (consumer).
 */
export function ArenaNode(props?: Readonly<ArenaNodeProps>) {
    const online = props?.wsUrl != null && props?.playerId != null;

    // Network setup (online mode only)
    if (online) {
        useWebSocket(props.wsUrl!, { autoReconnect: true });
        useRoom('arena');
    }

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
            left: -20,
            right: 20,
            top: 20,
            bottom: -20,
        },
    });

    // Accent point lights — colored fill from below the arena
    usePointLight({
        color: 0x48c9b0,
        intensity: 0.5,
        distance: 40,
        position: [-10, -3, -10],
    });
    usePointLight({
        color: 0xe74c3c,
        intensity: 0.3,
        distance: 40,
        position: [10, -3, 10],
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
        pendingKnockout: -1,
        paused: false,
    };
    useProvideContext(GameCtx, gameState);

    // Particle effects pool
    installParticles({ maxPerPool: 2048, defaultSize: 0.08 });

    // Arena platform
    useChild(PlatformNode);

    if (online) {
        // Online mode — one local player (producer) + one remote player (consumer)
        const localId = props.playerId!;
        const remoteId = 1 - localId;

        useChild(LocalPlayerNode, {
            playerId: localId,
            moveAction: 'p1Move',
            dashAction: 'p1Dash',
            replicate: true,
        });
        useChild(RemotePlayerNode, { remotePlayerId: remoteId, online: true });
    } else {
        // Local mode — both players on shared input
        useChild(LocalPlayerNode, {
            playerId: 0,
            moveAction: 'p1Move',
            dashAction: 'p1Dash',
        });
        useChild(LocalPlayerNode, {
            playerId: 1,
            moveAction: 'p2Move',
            dashAction: 'p2Dash',
        });
    }

    // Game manager — tracks knockout scores
    useChild(GameManagerNode, online ? { online } : undefined);

    // Score HUD
    useChild(ScoreHudNode);

    // Round lifecycle overlays
    useChild(KnockoutOverlayNode);
    useChild(CountdownOverlayNode);
    useChild(MatchOverOverlayNode, { onRequestMenu: props?.onRequestMenu });
    useChild(PauseMenuNode, { onRequestMenu: props?.onRequestMenu, online });

    // Disconnect overlay (online mode only)
    if (online) {
        useChild(DisconnectOverlayNode, {
            isHost: props.isHost ?? false,
            onRequestMenu: props.onRequestMenu,
        });
    }

    // Touch controls — self-gates on touch-capable devices
    useChild(TouchControlsNode);

    // Camera rig — fixed overhead view
    useChild(CameraRigNode);

    // Instant replay overlay — letterboxing + playback driver
    useChild(ReplayNode);

    // Victory confetti — fires on match_over
    useChild(VictoryEffectNode);
}
