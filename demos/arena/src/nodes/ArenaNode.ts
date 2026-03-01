import { useProvideContext, useChild } from '@pulse-ts/core';
import { useAmbientLight, useDirectionalLight, useFog } from '@pulse-ts/three';
import { installParticles } from '@pulse-ts/effects';
import { GameCtx, type GameState } from '../contexts';
import { PlatformNode } from './PlatformNode';
import { LocalPlayerNode } from './LocalPlayerNode';
import { GameManagerNode } from './GameManagerNode';
import { ScoreHudNode } from './ScoreHudNode';
import { KnockoutOverlayNode } from './KnockoutOverlayNode';
import { CountdownOverlayNode } from './CountdownOverlayNode';
import { MatchOverOverlayNode } from './MatchOverOverlayNode';
import { CameraRigNode } from './CameraRigNode';

/**
 * Top-level orchestrator node for the arena demo.
 * Sets up lighting, fog, shared contexts, and particle pools.
 * Mounts two local players in a single world — no network needed.
 */
export function ArenaNode() {
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
    };
    useProvideContext(GameCtx, gameState);

    // Particle effects pool
    installParticles({ maxPerPool: 256, defaultSize: 0.08 });

    // Arena platform
    useChild(PlatformNode);

    // Both players — each reads its own namespaced input actions
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

    // Game manager — tracks knockout scores
    useChild(GameManagerNode);

    // Score HUD
    useChild(ScoreHudNode);

    // Round lifecycle overlays
    useChild(KnockoutOverlayNode);
    useChild(CountdownOverlayNode);
    useChild(MatchOverOverlayNode);

    // Camera rig — fixed overhead view
    useChild(CameraRigNode);
}
