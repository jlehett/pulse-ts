import type { InitFn } from '@pulse-ts/effects';

/** Gravity pull applied to particles each frame (units/s²). */
export const BURST_GRAVITY = 9.8;

/** Base outward speed range for initial velocities. */
const MIN_SPEED = 1.5;
const MAX_SPEED = 4.0;

/** Default particle color (gold). */
const DEFAULT_COLOR = 0xf4d03f;

/** Number of particles in a single burst. */
export const BURST_COUNT = 24;

/** Total lifetime of a burst particle in seconds. */
export const BURST_LIFETIME = 0.5;

/**
 * Create an init callback that randomizes velocity and optionally overrides
 * the particle color.
 *
 * @param color - Optional hex color. Falls back to gold.
 * @returns An {@link InitFn} suitable for {@link ParticleEmitter.burst}.
 */
export function burstInit(color?: number): InitFn {
    return (p) => {
        p.lifetime = BURST_LIFETIME;
        p.velocity.randomDirection().scale(
            MIN_SPEED + Math.random() * (MAX_SPEED - MIN_SPEED),
        );
        p.color.set(color ?? DEFAULT_COLOR);
        p.opacity = 1;
    };
}
