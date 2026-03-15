import { TRAIL_BASE_INTERVAL, TRAIL_VELOCITY_REFERENCE } from '../config/arena';

/**
 * Minimum velocity magnitude (units/sec) required to emit trail particles.
 * Below this threshold, the accumulator resets to avoid spurious bursts
 * when the player is nearly stationary.
 */
const VELOCITY_THRESHOLD = 0.1;

/**
 * Minimum emission interval (seconds). Caps the emission rate even at
 * very high velocities so the particle system isn't overwhelmed.
 */
const MIN_INTERVAL = 0.01;

/**
 * Encapsulates velocity-proportional trail particle emission logic.
 *
 * Three arena nodes (LocalPlayer, RemotePlayer, Replay) all share the same
 * accumulator / interval / guard / reset pattern. This utility captures that
 * shared behavior so each consumer only provides a velocity magnitude and an
 * emit callback.
 *
 * @example
 * ```ts
 * const trail = createTrailEmitter();
 *
 * useFrameUpdate((dt) => {
 *   const vmag = Math.sqrt(vx * vx + vz * vz);
 *   trail.update(dt, vmag, isActive, () => {
 *     burst([x, y, z]);
 *   });
 * });
 * ```
 */
export interface TrailEmitter {
    /**
     * Advance the trail accumulator and emit when the interval elapses.
     *
     * @param dt - Frame delta time in seconds.
     * @param vmag - Current velocity magnitude (units/sec).
     * @param active - Whether trail emission is enabled (e.g. playing phase).
     * @param emit - Callback invoked when a trail particle should be emitted.
     */
    update(dt: number, vmag: number, active: boolean, emit: () => void): void;

    /** Reset the accumulator to zero (e.g. on round reset). */
    reset(): void;
}

/**
 * Create a new trail emitter with its own accumulator state.
 *
 * @returns A {@link TrailEmitter} instance.
 *
 * @example
 * ```ts
 * const trail = createTrailEmitter();
 * trail.update(dt, vmag, true, () => burst(pos));
 * ```
 */
export function createTrailEmitter(): TrailEmitter {
    let accum = 0;

    return {
        update(dt: number, vmag: number, active: boolean, emit: () => void) {
            if (!active) {
                accum = 0;
                return;
            }
            if (vmag > VELOCITY_THRESHOLD) {
                accum += dt;
                const interval = Math.max(
                    MIN_INTERVAL,
                    TRAIL_BASE_INTERVAL / (vmag / TRAIL_VELOCITY_REFERENCE),
                );
                if (accum >= interval) {
                    accum = 0;
                    emit();
                }
            } else {
                accum = 0;
            }
        },

        reset() {
            accum = 0;
        },
    };
}
