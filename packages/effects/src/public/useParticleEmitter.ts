import { useWorld, useComponent, useFrameUpdate, useDestroy, Transform } from '@pulse-ts/core';
import {
    ParticlesService,
    buildInit,
    buildUpdate,
    type ParticleStyleOptions,
} from '../domain/ParticlesService';
import type { BlendingMode } from './useParticles';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Options for {@link useParticleEmitter}.
 */
export interface ParticleEmitterOptions extends ParticleStyleOptions {
    /** Emission rate in particles per second. */
    rate: number;
    /** Whether the emitter starts active. Default: `true`. */
    autoStart?: boolean;
}

/**
 * Handle returned by {@link useParticleEmitter} for controlling emission.
 */
export interface EmitterHandle {
    /** Pause emission. In-flight particles continue naturally. */
    pause(): void;
    /** Resume emission. */
    resume(): void;
    /** Whether the emitter is currently active. */
    active: boolean;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Declarative continuous particle emitter hook. Emits particles at a
 * configurable rate from the node's world position each frame.
 *
 * Uses the world-level {@link ParticlesService} registered by
 * {@link installParticles}. Throws if the service is not installed.
 *
 * @param options - Emitter configuration (rate, lifetime, color, speed, etc.).
 * @returns An {@link EmitterHandle} for pausing/resuming emission.
 *
 * @example
 * ```ts
 * import { useParticleEmitter } from '@pulse-ts/effects';
 *
 * function TorchNode() {
 *     const emitter = useParticleEmitter({
 *         rate: 30, lifetime: 0.8, color: 0xff6600,
 *         speed: [0.5, 2], gravity: -1, blending: 'additive',
 *     });
 *
 *     // Later: emitter.pause(); emitter.resume();
 * }
 * ```
 */
export function useParticleEmitter(
    options: Readonly<ParticleEmitterOptions>,
): EmitterHandle {
    const world = useWorld();
    const service = world.getService(ParticlesService);
    if (!service) {
        throw new Error(
            'ParticlesService not provided. Call installParticles() first.',
        );
    }

    const blending: BlendingMode = options.blending ?? 'normal';
    const { pool } = service.getPool(blending);

    const initFn = buildInit(options, service.defaultSize);
    const updateFn = buildUpdate(options);

    // Set up the pool's shared update dispatcher (same as useParticleBurst)
    if (!pool.update) {
        pool.update = (p, dt) => {
            const custom = p.userData._customUpdate as
                | ((p: typeof p, dt: number) => void)
                | undefined;
            custom?.(p, dt);
        };
    }

    // Composite init that stores the update in userData
    const compositeInit = (p: Parameters<typeof initFn>[0]) => {
        initFn(p);
        p.userData._customUpdate = updateFn;
    };

    const transform = useComponent(Transform);
    let accumulator = 0;
    let active = options.autoStart !== false;

    useFrameUpdate((dt) => {
        if (!active) return;

        accumulator += options.rate * dt;
        const toSpawn = Math.floor(accumulator);
        accumulator -= toSpawn;

        if (toSpawn > 0) {
            const wp = transform.worldPosition;
            pool.burst(toSpawn, [wp.x, wp.y, wp.z], compositeInit);
        }
    });

    useDestroy(() => {
        active = false;
    });

    const handle: EmitterHandle = {
        pause() { active = false; },
        resume() { active = true; },
        get active() { return active; },
        set active(v: boolean) { active = v; },
    };

    return handle;
}
