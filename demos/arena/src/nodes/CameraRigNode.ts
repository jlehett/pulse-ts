import { useFrameUpdate, useContext } from '@pulse-ts/core';
import { useThreeContext } from '@pulse-ts/three';
import { GameCtx, type RoundPhase } from '../contexts';

/** Fixed camera height above the arena center. */
export const CAMERA_HEIGHT = 26;

/** Small Z offset to avoid degenerate straight-down lookAt. */
export const CAMERA_Z_OFFSET = 2;

// ---------------------------------------------------------------------------
// Module-level shake state — shared across all callers
// ---------------------------------------------------------------------------

let shakeIntensity = 0;
let shakeDuration = 0;
let shakeElapsed = 0;

/**
 * Trigger a camera shake effect. If a shake is already active, the new
 * shake only overrides it when the new intensity is stronger.
 *
 * @param intensity - Maximum offset in world units (e.g. 0.3 for small, 0.8 for big).
 * @param duration - Duration in seconds.
 *
 * @example
 * ```ts
 * triggerCameraShake(0.3, 0.2); // small collision shake
 * triggerCameraShake(0.8, 0.5); // big knockout shake
 * ```
 */
export function triggerCameraShake(intensity: number, duration: number): void {
    if (intensity > shakeIntensity) {
        shakeIntensity = intensity;
        shakeDuration = duration;
        shakeElapsed = 0;
    }
}

/**
 * Reset shake state. Exported for testing.
 */
export function resetCameraShake(): void {
    shakeIntensity = 0;
    shakeDuration = 0;
    shakeElapsed = 0;
}

/**
 * Fixed overhead camera centered on the arena with shake support.
 * Both players are always visible on the small platform, so there is
 * no need to follow an individual player. Auto-triggers a big shake
 * on knockout flash.
 */
export function CameraRigNode() {
    const { camera } = useThreeContext();
    const gameState = useContext(GameCtx);

    camera.position.set(0, CAMERA_HEIGHT, CAMERA_Z_OFFSET);
    camera.lookAt(0, 0, 0);

    let lastPhase: RoundPhase = gameState.phase;

    useFrameUpdate((dt) => {
        // Auto-trigger big shake on ko_flash transition
        if (gameState.phase === 'ko_flash' && lastPhase !== 'ko_flash') {
            triggerCameraShake(0.8, 0.5);
        }
        lastPhase = gameState.phase;

        // Apply shake offset
        if (shakeIntensity > 0) {
            shakeElapsed += dt;
            const t = Math.min(shakeElapsed / shakeDuration, 1);
            const decay = 1 - t;

            if (t >= 1) {
                // Shake finished — reset
                shakeIntensity = 0;
                shakeDuration = 0;
                shakeElapsed = 0;
                camera.position.set(0, CAMERA_HEIGHT, CAMERA_Z_OFFSET);
            } else {
                // Apply random XZ offset scaled by decaying intensity
                const offset = shakeIntensity * decay;
                const ox = (Math.random() * 2 - 1) * offset;
                const oz = (Math.random() * 2 - 1) * offset;
                camera.position.set(ox, CAMERA_HEIGHT, CAMERA_Z_OFFSET + oz);
            }
        }
    });
}
