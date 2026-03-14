import {
    useFrameUpdate,
    useContext,
    useStore,
    useWatch,
    damp,
} from '@pulse-ts/core';
import { useThreeContext } from '@pulse-ts/three';
import { GameCtx } from '../contexts';
import {
    ReplayStore,
    isReplayActive,
    getReplayPosition,
    getReplayScorer,
    getReplayKnockedOut,
    getReplayHitProximity,
    getReplayPastHit,
    hasReplayHit,
} from '../replay';
import { SPAWN_POSITIONS } from '../config/arena';

/** Fixed camera height above the arena center. */
export const CAMERA_HEIGHT = 26;

/** Camera height during intro cinematic. */
export const INTRO_CAMERA_HEIGHT = 8;

/** Camera orbit distance from the AI player during intro. */
export const INTRO_CAMERA_DISTANCE = 6;

/** Camera orbit speed during intro (radians per second). */
export const INTRO_ORBIT_SPEED = 0.8;

/**
 * Vertical offset added to the lookAt target during intro.
 * Positive = look above the player, pushing the sphere below screen center
 * so it sits under the overlay banner.
 */
export const INTRO_LOOK_Y_OFFSET = 3;

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

/** Y position below which the loser is considered to have "fallen" — camera starts zooming out. */
export const REPLAY_LOSER_FALLEN_Y = -3;

/** Y range over which the camera transitions from follow to overhead after loser falls. */
export const REPLAY_FALL_ZOOM_RANGE = 7;

/** XZ separation below which no extra camera height is needed during tie replay. */
export const REPLAY_TIE_BASE_SEPARATION = 6;

/** Extra camera height gained per unit of player separation beyond the base. */
export const REPLAY_TIE_HEIGHT_PER_UNIT = 0.8;

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
    const [replay] = useStore(ReplayStore);

    camera.position.set(0, CAMERA_HEIGHT, CAMERA_Z_OFFSET);
    camera.lookAt(0, 0, 0);

    // Auto-trigger big shake on ko_flash transition
    useWatch(
        () => gameState.phase,
        (phase) => {
            if (phase === 'ko_flash') {
                triggerCameraShake(0.8, 0.5);
            }
        },
        { kind: 'frame' },
    );

    // Intro cinematic elapsed time
    let introElapsed = 0;

    // Smooth camera state for replay transitions
    // If starting in intro phase, initialise the camera to the intro orbit
    const p2Spawn = SPAWN_POSITIONS[1];
    const introStartAngle = 0;
    const initCamX =
        gameState.phase === 'intro'
            ? p2Spawn[0] + Math.cos(introStartAngle) * INTRO_CAMERA_DISTANCE
            : 0;
    const initCamY =
        gameState.phase === 'intro' ? INTRO_CAMERA_HEIGHT : CAMERA_HEIGHT;
    const initCamZ =
        gameState.phase === 'intro'
            ? p2Spawn[2] + Math.sin(introStartAngle) * INTRO_CAMERA_DISTANCE
            : CAMERA_Z_OFFSET;

    let camX = initCamX;
    let camY = initCamY;
    let camZ = initCamZ;
    let lookX = gameState.phase === 'intro' ? p2Spawn[0] : 0;
    let lookY =
        gameState.phase === 'intro' ? p2Spawn[1] + INTRO_LOOK_Y_OFFSET : 0;
    let lookZ = gameState.phase === 'intro' ? p2Spawn[2] : 0;

    useFrameUpdate((dt) => {
        // Compute target camera position
        let targetX = 0;
        let targetY = CAMERA_HEIGHT;
        let targetZ = CAMERA_Z_OFFSET;
        let targetLookX = 0;
        let targetLookY = 0;
        let targetLookZ = 0;

        if (gameState.phase === 'intro') {
            // Orbit around AI player (P2 spawn)
            introElapsed += dt;
            const angle = introElapsed * INTRO_ORBIT_SPEED;
            targetX = p2Spawn[0] + Math.cos(angle) * INTRO_CAMERA_DISTANCE;
            targetY = INTRO_CAMERA_HEIGHT;
            targetZ = p2Spawn[2] + Math.sin(angle) * INTRO_CAMERA_DISTANCE;
            targetLookX = p2Spawn[0];
            targetLookY = p2Spawn[1] + INTRO_LOOK_Y_OFFSET;
            targetLookZ = p2Spawn[2];
        } else if (isReplayActive(replay)) {
            const hitProx = hasReplayHit(replay)
                ? getReplayHitProximity(replay)
                : 0;

            if (gameState.isTie) {
                // Tie replay: follow the midpoint between both players,
                // dynamically adjusting height to keep both in frame.
                const p0 = getReplayPosition(replay, 0);
                const p1 = getReplayPosition(replay, 1);

                if (p0 && p1) {
                    const midX = (p0[0] + p1[0]) / 2;
                    const midY = (p0[1] + p1[1]) / 2;
                    const midZ = (p0[2] + p1[2]) / 2;

                    // Dynamic height based on player separation
                    const dx = p0[0] - p1[0];
                    const dz = p0[2] - p1[2];
                    const separation = Math.sqrt(dx * dx + dz * dz);
                    const extraHeight =
                        Math.max(0, separation - REPLAY_TIE_BASE_SEPARATION) *
                        REPLAY_TIE_HEIGHT_PER_UNIT;

                    const baseHeight =
                        REPLAY_CAMERA_HEIGHT +
                        extraHeight -
                        REPLAY_HIT_ZOOM * hitProx;

                    // Fall zoom-out: use the lower Y of the two players
                    const lowestY = Math.min(p0[1], p1[1]);
                    let zoomOut = 0;
                    if (lowestY < REPLAY_LOSER_FALLEN_Y) {
                        const fallDist = REPLAY_LOSER_FALLEN_Y - lowestY;
                        zoomOut = Math.min(
                            fallDist / REPLAY_FALL_ZOOM_RANGE,
                            1,
                        );
                    }

                    const follow = 1 - zoomOut;
                    targetX = midX * follow;
                    targetY = baseHeight * follow + CAMERA_HEIGHT * zoomOut;
                    targetZ =
                        (midZ + REPLAY_CAMERA_FOLLOW_DIST) * follow +
                        CAMERA_Z_OFFSET * zoomOut;
                    targetLookX = midX * follow;
                    targetLookY = midY * follow;
                    targetLookZ = midZ * follow;
                }
            } else {
                // Normal replay: follow scorer before hit, loser after hit
                const scorerId = getReplayScorer(replay);
                const knockedOutId = getReplayKnockedOut(replay);
                const pastHit = hasReplayHit(replay)
                    ? getReplayPastHit(replay)
                    : 0;

                let followId: number;
                if (!hasReplayHit(replay) || pastHit > 0) {
                    followId = knockedOutId;
                } else {
                    followId = scorerId;
                }

                const followPos = getReplayPosition(replay, followId);
                const loserPos = getReplayPosition(replay, knockedOutId);

                // Zoom out to overhead once the loser has fallen off the platform
                let zoomOut = 0;
                if (loserPos && loserPos[1] < REPLAY_LOSER_FALLEN_Y) {
                    const fallDist = REPLAY_LOSER_FALLEN_Y - loserPos[1];
                    zoomOut = Math.min(fallDist / REPLAY_FALL_ZOOM_RANGE, 1);
                }

                if (followPos) {
                    const followX = followPos[0];
                    const followY =
                        REPLAY_CAMERA_HEIGHT - REPLAY_HIT_ZOOM * hitProx;
                    const followZ = followPos[2] + REPLAY_CAMERA_FOLLOW_DIST;

                    const follow = 1 - zoomOut;
                    targetX = followX * follow;
                    targetY = followY * follow + CAMERA_HEIGHT * zoomOut;
                    targetZ = followZ * follow + CAMERA_Z_OFFSET * zoomOut;
                    targetLookX = followPos[0] * follow;
                    targetLookY = followPos[1] * follow;
                    targetLookZ = followPos[2] * follow;
                }
            }
        }

        // Smoothly interpolate camera toward target
        camX = damp(camX, targetX, REPLAY_CAMERA_SMOOTH, dt);
        camY = damp(camY, targetY, REPLAY_CAMERA_SMOOTH, dt);
        camZ = damp(camZ, targetZ, REPLAY_CAMERA_SMOOTH, dt);
        lookX = damp(lookX, targetLookX, REPLAY_CAMERA_SMOOTH, dt);
        lookY = damp(lookY, targetLookY, REPLAY_CAMERA_SMOOTH, dt);
        lookZ = damp(lookZ, targetLookZ, REPLAY_CAMERA_SMOOTH, dt);

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
