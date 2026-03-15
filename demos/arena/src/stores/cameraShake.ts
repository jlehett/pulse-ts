import { defineStore } from '@pulse-ts/core';

/**
 * World-scoped store for camera shake state.
 * Automatically resets when the world is destroyed, eliminating the need
 * for manual reset calls between game sessions.
 *
 * @example
 * ```ts
 * import { useStore } from '@pulse-ts/core';
 * import { CameraShakeStore } from '../cameraShake';
 *
 * const [shake] = useStore(CameraShakeStore);
 * // Read current shake intensity
 * if (shake.intensity > 0) { ... }
 * ```
 */
export const CameraShakeStore = defineStore('cameraShake', () => ({
    intensity: 0,
    duration: 0,
    elapsed: 0,
}));

/**
 * Trigger a camera shake effect. If a shake is already active, the new
 * shake only overrides it when the new intensity is stronger.
 *
 * @param shake - The current shake store state.
 * @param intensity - Maximum offset in world units (e.g. 0.3 for small, 0.8 for big).
 * @param duration - Duration in seconds.
 *
 * @example
 * ```ts
 * const [shake] = useStore(CameraShakeStore);
 * triggerCameraShake(shake, 0.3, 0.2); // small collision shake
 * triggerCameraShake(shake, 0.8, 0.5); // big knockout shake
 * ```
 */
export function triggerCameraShake(
    shake: { intensity: number; duration: number; elapsed: number },
    intensity: number,
    duration: number,
): void {
    if (intensity > shake.intensity) {
        shake.intensity = intensity;
        shake.duration = duration;
        shake.elapsed = 0;
    }
}
