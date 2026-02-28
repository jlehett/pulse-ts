import { useProvideContext, useChild } from '@pulse-ts/core';
import { useAmbientLight, useDirectionalLight, useFog } from '@pulse-ts/three';
import { installParticles } from '@pulse-ts/effects';
import { GameCtx, PlayerIdCtx, type GameState } from '../contexts';
import { PlatformNode } from './PlatformNode';

export interface ArenaNodeProps {
    playerId: number;
}

/**
 * Top-level orchestrator node for the arena demo.
 * Sets up lighting, fog, shared contexts, and particle pools.
 * Each world instance mounts its own ArenaNode with a different playerId.
 */
export function ArenaNode({ playerId }: ArenaNodeProps) {
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
    const gameState: GameState = { scores: [0, 0], round: 1 };
    useProvideContext(GameCtx, gameState);
    useProvideContext(PlayerIdCtx, playerId);

    // Particle effects pool
    installParticles({ maxPerPool: 200, defaultSize: 0.08 });

    // Arena platform
    useChild(PlatformNode);
}
