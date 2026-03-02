import { useFrameUpdate, useContext } from '@pulse-ts/core';
import { useParticleBurst } from '@pulse-ts/effects';
import { GameCtx, type RoundPhase } from '../contexts';

/** Confetti colors — teal, coral, gold, blue, white. */
const CONFETTI_COLORS = [0x48c9b0, 0xe74c3c, 0xf4d03f, 0x3498db, 0xffffff];

/** Number of particles per color burst. */
const PARTICLES_PER_COLOR = 40;

/** World-space spawn position for confetti (arena center, above platform). */
const SPAWN_POSITION: [number, number, number] = [0, 3, 0];

/**
 * Victory confetti effect — fires a multi-color particle burst when
 * the game transitions to the `match_over` phase.
 */
export function VictoryEffectNode() {
    const gameState = useContext(GameCtx);

    // Create one burst function per color
    const bursts = CONFETTI_COLORS.map((color) =>
        useParticleBurst({
            count: PARTICLES_PER_COLOR,
            lifetime: 1.5,
            color,
            speed: [3, 8],
            gravity: 5,
            size: 0.3,
            blending: 'additive',
            shrink: true,
        }),
    );

    let lastPhase: RoundPhase = gameState.phase;

    useFrameUpdate(() => {
        if (gameState.phase === 'match_over' && lastPhase !== 'match_over') {
            // Fire all color bursts from the arena center
            for (const burst of bursts) {
                burst(SPAWN_POSITION);
            }
        }
        lastPhase = gameState.phase;
    });
}
