import { useFrameUpdate, useContext } from '@pulse-ts/core';
import { useThreeContext } from '@pulse-ts/three';
import { GameCtx, type RoundPhase } from '../contexts';
import {
    isReplayActive,
    getReplayPosition,
    getReplayScorer,
    getReplayHitProximity,
} from '../replay';

/** Fixed camera height above the arena center. */
export const CAMERA_HEIGHT = 26;

/** Small Z offset to avoid degenerate straight-down lookAt. */
export const CAMERA_Z_OFFSET = 2;

/** Camera height during replay (lower than overhead to feel cinematic). */
export const REPLAY_CAMERA_HEIGHT = 12;

/** Camera distance behind the scoring player during replay. */
export const REPLAY_CAMERA_FOLLOW_DIST = 10;

/** Additional zoom-in at the hit moment (subtracted from height). */
export const REPLAY_HIT_ZOOM = 4;

/** Smoothing factor for replay camera position (lerp per second). */
export const REPLAY_CAMERA_SMOOTH = 6;

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
 * During replay, smoothly transitions to a cinematic follow-cam
 * tracking the scoring player, with zoom on the hit moment.
 * Auto-triggers a big shake on knockout flash.
 */
export function CameraRigNode() {
    const { camera } = useThreeContext();
    const gameState = useContext(GameCtx);

    camera.position.set(0, CAMERA_HEIGHT, CAMERA_Z_OFFSET);
    camera.lookAt(0, 0, 0);

    let lastPhase: RoundPhase = gameState.phase;

    // Smooth camera state for replay transitions
    let camX = 0;
    let camY = CAMERA_HEIGHT;
    let camZ = CAMERA_Z_OFFSET;
    let lookX = 0;
    let lookY = 0;
    let lookZ = 0;

    useFrameUpdate((dt) => {
        // Auto-trigger big shake on ko_flash transition
        if (gameState.phase === 'ko_flash' && lastPhase !== 'ko_flash') {
            triggerCameraShake(0.8, 0.5);
        }
        lastPhase = gameState.phase;

        // Compute target camera position
        let targetX = 0;
        let targetY = CAMERA_HEIGHT;
        let targetZ = CAMERA_Z_OFFSET;
        let targetLookX = 0;
        let targetLookY = 0;
        let targetLookZ = 0;

        if (isReplayActive()) {
            const scorerId = getReplayScorer();
            const scorerPos = getReplayPosition(scorerId);
            const hitProx = getReplayHitProximity();

            if (scorerPos) {
                // Follow the scorer from behind and above
                targetLookX = scorerPos[0];
                targetLookY = scorerPos[1];
                targetLookZ = scorerPos[2];
                targetX = scorerPos[0];
                targetY = REPLAY_CAMERA_HEIGHT - REPLAY_HIT_ZOOM * hitProx;
                targetZ = scorerPos[2] + REPLAY_CAMERA_FOLLOW_DIST;
            }
        }

        // Smoothly interpolate camera toward target
        const s = 1 - Math.exp(-REPLAY_CAMERA_SMOOTH * dt);
        camX += (targetX - camX) * s;
        camY += (targetY - camY) * s;
        camZ += (targetZ - camZ) * s;
        lookX += (targetLookX - lookX) * s;
        lookY += (targetLookY - lookY) * s;
        lookZ += (targetLookZ - lookZ) * s;

        // Apply shake offset on top of the smoothed position
        let finalX = camX;
        let finalY = camY;
        let finalZ = camZ;

        if (shakeIntensity > 0) {
            shakeElapsed += dt;
            const t = Math.min(shakeElapsed / shakeDuration, 1);
            const decay = 1 - t;

            if (t >= 1) {
                shakeIntensity = 0;
                shakeDuration = 0;
                shakeElapsed = 0;
            } else {
                const offset = shakeIntensity * decay;
                finalX += (Math.random() * 2 - 1) * offset;
                finalZ += (Math.random() * 2 - 1) * offset;
            }
        }

        camera.position.set(finalX, finalY, finalZ);
        camera.lookAt(lookX, lookY, lookZ);
    });
}
