import { useProvideContext, useChild, color } from '@pulse-ts/core';
import {
    useAmbientLight,
    useDirectionalLight,
    usePointLight,
    useFog,
} from '@pulse-ts/three';
import { useConnection } from '@pulse-ts/network';
import type { Transport } from '@pulse-ts/network';
import { installParticles } from '@pulse-ts/effects';
import type { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
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
import { ReplayOverlayNode } from './ReplayOverlayNode';
import { ShockwaveNode } from './ShockwaveNode';
import { NebulaNode } from './NebulaNode';
import { StarfieldNode } from './StarfieldNode';
import { SupernovaNode } from './SupernovaNode';
import { AtmosphericDustNode } from './AtmosphericDustNode';
import { EnergyPillarsNode } from './EnergyPillarsNode';
import { AiPlayerNode } from './AiPlayerNode';
import { IntroOverlayNode } from './IntroOverlayNode';
import { DashCooldownHudNode } from './DashCooldownHudNode';
import type { AiPersonality } from '../ai/personalities';

export interface ArenaNodeProps {
    /** Local player ID for online mode (0 or 1). Omit for local 2-player. */
    playerId?: number;
    /** P2P transport for online mode (DataChannel). Omit for local 2-player. */
    transport?: Transport;
    /** Whether the local player is the host (online mode). */
    isHost?: boolean;
    /** The shockwave ShaderPass from `setupPostProcessing`. */
    shockwavePass?: ShaderPass;
    /** Callback invoked when the player requests to return to the main menu. */
    onRequestMenu?: () => void;
    /** Callback invoked when a rematch is confirmed. */
    onRequestRematch?: () => void;
    /** AI personality for solo mode. When set, P2 is AI-controlled. */
    aiPersonality?: AiPersonality;
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
    const online = props?.transport != null && props?.playerId != null;

    // Network setup (online mode only) — P2P transport from lobby handshake.
    // disconnectOnCleanup: false keeps the DataChannel alive across rematches;
    // the transport is manually disconnected in onRequestMenu (main.ts).
    if (online) {
        useConnection(props.transport!, { disconnectOnCleanup: false });
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

    // Shared game state — solo mode starts in 'intro' for the cinematic
    const gameState: GameState = {
        scores: [0, 0],
        round: 1,
        phase: props?.aiPersonality
            ? 'intro'
            : online
              ? 'countdown'
              : 'playing',
        lastKnockedOut: -1,
        countdownValue: -1,
        matchWinner: -1,
        isTie: false,
        paused: false,
        playerConfig: props?.aiPersonality
            ? {
                  labels: ['You', props.aiPersonality.name],
                  colors: [
                      color(0x48c9b0).rgb,
                      color(props.aiPersonality.color).rgb,
                  ],
                  hexColors: [0x48c9b0, props.aiPersonality.color],
              }
            : undefined,
    };
    useProvideContext(GameCtx, gameState);

    // Particle effects pool
    installParticles({ maxPerPool: 4096, defaultSize: 0.08 });

    // Arena platform
    useChild(PlatformNode);

    // Environment atmosphere
    useChild(NebulaNode);
    useChild(StarfieldNode);
    useChild(SupernovaNode);
    useChild(AtmosphericDustNode);
    useChild(EnergyPillarsNode);

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
    } else if (props?.aiPersonality) {
        // Solo mode — human P1 vs AI P2
        useChild(LocalPlayerNode, {
            playerId: 0,
            moveAction: 'p1Move',
            dashAction: 'p1Dash',
            showIndicatorRing: true,
        });
        useChild(AiPlayerNode, {
            playerId: 1,
            moveAction: 'p2Move',
            dashAction: 'p2Dash',
            personality: props.aiPersonality,
        });
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

    // Game manager — tracks knockout scores, host-authoritative countdown sync
    useChild(
        GameManagerNode,
        online ? { online, isHost: props!.isHost } : undefined,
    );

    // Score HUD
    useChild(ScoreHudNode);

    // Round lifecycle overlays
    useChild(KnockoutOverlayNode);
    useChild(CountdownOverlayNode);
    useChild(MatchOverOverlayNode, {
        onRequestMenu: props?.onRequestMenu,
        onRequestRematch: props?.onRequestRematch,
        online,
    });
    useChild(PauseMenuNode, { onRequestMenu: props?.onRequestMenu, online });

    // Disconnect overlay (online mode only)
    if (online) {
        useChild(DisconnectOverlayNode, {
            isHost: props.isHost ?? false,
            onRequestMenu: props.onRequestMenu,
        });
    }

    // Intro cinematic overlay (solo mode only)
    if (props?.aiPersonality) {
        useChild(IntroOverlayNode, { personality: props.aiPersonality });
    }

    // Touch controls — self-gates on touch-capable devices
    const localId = online ? props.playerId! : 0;
    useChild(TouchControlsNode, { playerId: localId });

    // Dash cooldown HUD bar — desktop only (mobile uses dash button fill)
    useChild(DashCooldownHudNode, { playerId: localId });

    // Camera rig — fixed overhead view
    useChild(CameraRigNode);

    // Instant replay — playback driver + VFX
    useChild(ReplayNode);

    // Instant replay — DOM overlay (letterbox, flash, labels)
    useChild(ReplayOverlayNode);

    // Shockwave distortion — screen-space ring on impact
    useChild(ShockwaveNode, { pass: props?.shockwavePass });

    // Victory confetti — fires on match_over
    useChild(VictoryEffectNode);
}
