import { useProvideContext } from '@pulse-ts/core';
import { useParticles, type InitFn } from '@pulse-ts/effects';
import { ParticleEffectsCtx } from '../contexts';

/** Gravity pull applied to particles each frame (units/s²). */
const GRAVITY = 9.8;

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

/**
 * Scene-level particle emitter shared via context.
 *
 * Provides a single `useParticles` instance that any descendant node can
 * trigger via `useContext(ParticleEffectsCtx)`. Supports gold (collectible)
 * and red (enemy stomp) bursts by passing a per-burst init override.
 *
 * @example
 * ```ts
 * // Trigger a gold burst from any descendant:
 * const fx = useContext(ParticleEffectsCtx);
 * fx.burst(24, [x, y, z]);
 *
 * // Trigger a red burst:
 * import { burstInit } from './ParticleEffectsNode';
 * fx.burst(24, [x, y, z], burstInit(0xcc2200));
 * ```
 */
export function ParticleEffectsNode() {
    const emitter = useParticles({
        maxCount: 200,
        size: 0.08,
        blending: 'additive',
        init: burstInit(),
        update: (p, dt) => {
            p.velocity.y -= GRAVITY * dt;
            p.opacity = 1 - p.age / p.lifetime;
        },
    });

    useProvideContext(ParticleEffectsCtx, emitter);
}
