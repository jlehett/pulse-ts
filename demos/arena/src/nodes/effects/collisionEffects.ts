/**
 * Shared collision VFX trigger — encapsulates the visual and audio burst
 * that fires on every player-vs-player collision (live or replay).
 */

import { triggerCameraShake } from '../../stores/cameraShake';
import { worldToScreen } from '../../stores/shockwave';

/** Dependencies for {@link triggerCollisionEffects}. */
export interface CollisionEffectsDeps {
    /** Particle burst callback — spawns white particles at the given position. */
    impactBurst: (pos: [number, number, number]) => void;
    /** Impact sound effect. */
    impactSfx: { play: () => void };
    /** Shockwave post-process pool. */
    shockwavePool: { trigger: (opts: { centerX: number; centerY: number }) => void };
    /** Hit impact pool (ground ring). */
    hitImpactPool: { trigger: (opts: { worldX: number; worldZ: number }) => void };
    /** Three.js camera for world-to-screen projection. */
    camera: Parameters<typeof worldToScreen>[3];
    /** Camera shake store state. */
    cameraShake: { intensity: number; duration: number; elapsed: number };
}

/**
 * Fire the full collision VFX + audio burst at a world-space position.
 *
 * Sequence:
 * 1. Spawn white particle burst at `worldPos`
 * 2. Trigger camera shake
 * 3. Project position to screen-space UV
 * 4. Trigger shockwave pool
 * 5. Trigger hit impact pool
 * 6. Play impact sound
 *
 * @param worldPos - `[x, y, z]` world-space impact position.
 * @param deps - Pool handles, camera, and sound effect.
 * @param shakeIntensity - Camera shake intensity (default 0.3).
 * @param shakeDuration - Camera shake duration in seconds (default 0.2).
 *
 * @example
 * ```ts
 * triggerCollisionEffects([mx, my, mz], {
 *     impactBurst, impactSfx, shockwavePool, hitImpactPool, camera,
 * });
 * ```
 */
export function triggerCollisionEffects(
    worldPos: [number, number, number],
    deps: CollisionEffectsDeps,
    shakeIntensity = 0.3,
    shakeDuration = 0.2,
): void {
    deps.impactBurst(worldPos);
    triggerCameraShake(deps.cameraShake, shakeIntensity, shakeDuration);

    const [su, sv] = worldToScreen(
        worldPos[0],
        worldPos[1],
        worldPos[2],
        deps.camera,
    );
    deps.shockwavePool.trigger({ centerX: su, centerY: sv });
    deps.hitImpactPool.trigger({ worldX: worldPos[0], worldZ: worldPos[2] });

    deps.impactSfx.play();
}
