import { useProvideContext, useChild, useFrameUpdate } from '@pulse-ts/core';
import {
    useAmbientLight,
    useDirectionalLight,
    usePointLight,
    useFog,
    useThreeContext,
} from '@pulse-ts/three';
import { installParticles } from '@pulse-ts/effects';
import { GameCtx, type GameState } from '../contexts';
import { PlatformNode } from './PlatformNode';
import { NebulaNode } from './NebulaNode';
import { StarfieldNode } from './StarfieldNode';
import { SupernovaNode } from './SupernovaNode';
import { AtmosphericDustNode } from './AtmosphericDustNode';
import { EnergyPillarsNode } from './EnergyPillarsNode';

/** Camera orbit height — between overhead (26) and intro (8). */
const ORBIT_HEIGHT = 12;

/** Camera orbit distance from center. */
const ORBIT_DISTANCE = 18;

/** Camera orbit speed in radians per second (~42s per revolution). */
const ORBIT_SPEED = 0.15;

/**
 * Lightweight scene node for the main menu's 3D background.
 *
 * Reuses the arena's environment nodes (platform, nebula, starfield, etc.)
 * with a slow orbiting camera for a cinematic menu backdrop. No players,
 * game logic, HUD, input, audio, or network.
 *
 * @example
 * ```ts
 * world.mount(MenuSceneNode);
 * world.start();
 * ```
 */
export function MenuSceneNode() {
    // Lighting — same as ArenaNode
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

    // Accent point lights
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

    // Fog for depth
    useFog({ color: 0x0a0a1a, near: 30, far: 60 });

    // Minimal game state — AtmosphericDustNode needs GameCtx
    const gameState: GameState = {
        scores: [0, 0],
        round: 1,
        phase: 'playing',
        lastKnockedOut: -1,
        countdownValue: -1,
        matchWinner: -1,
        isTie: false,
        paused: false,
    };
    useProvideContext(GameCtx, gameState);

    // Particle effects pool
    installParticles({ maxPerPool: 4096, defaultSize: 0.08 });

    // Environment
    useChild(PlatformNode);
    useChild(NebulaNode);
    useChild(StarfieldNode);
    useChild(SupernovaNode);
    useChild(AtmosphericDustNode);
    useChild(EnergyPillarsNode);

    // Slow orbiting camera
    const { camera } = useThreeContext();
    let elapsed = 0;

    // Set initial position
    camera.position.set(
        Math.cos(0) * ORBIT_DISTANCE,
        ORBIT_HEIGHT,
        Math.sin(0) * ORBIT_DISTANCE,
    );
    camera.lookAt(0, 0, 0);

    useFrameUpdate((dt) => {
        elapsed += dt;
        const angle = elapsed * ORBIT_SPEED;
        camera.position.set(
            Math.cos(angle) * ORBIT_DISTANCE,
            ORBIT_HEIGHT,
            Math.sin(angle) * ORBIT_DISTANCE,
        );
        camera.lookAt(0, 0, 0);
    });
}
