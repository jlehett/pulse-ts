import { useWorld } from '@pulse-ts/core';
import {
    ParticlesService,
    buildInit,
    buildUpdate,
    type ParticleStyleOptions,
} from '../domain/ParticlesService';
import type { Point3, Particle } from '../domain/ParticlePool';
import type { BlendingMode } from './useParticles';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Options for {@link useParticleBurst}.
 */
export interface ParticleBurstOptions extends ParticleStyleOptions {
    /** Number of particles per burst. */
    count: number;
}

/**
 * Function returned by {@link useParticleBurst}. Call it to spawn a burst
 * of particles at a given world-space position.
 *
 * @param position - World-space origin for the burst.
 */
export type BurstFn = (position: Point3) => void;

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Declarative particle burst hook. Returns a function that spawns a
 * one-shot burst of particles at a world-space position.
 *
 * Uses the world-level {@link ParticlesService} registered by
 * {@link installParticles}. Throws if the service is not installed.
 *
 * @param options - Burst configuration (count, lifetime, color, speed, etc.).
 * @returns A {@link BurstFn} that triggers the burst.
 *
 * @example
 * ```ts
 * import { useParticleBurst } from '@pulse-ts/effects';
 *
 * function CollectibleNode() {
 *     const burst = useParticleBurst({
 *         count: 24, lifetime: 0.5, color: 0xf4d03f,
 *         speed: [1.5, 4], gravity: 9.8,
 *     });
 *
 *     // On pickup:
 *     burst([x, y, z]);
 * }
 * ```
 */
export function useParticleBurst(
    options: Readonly<ParticleBurstOptions>,
): BurstFn {
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

    // The pool has no pool-level update, so we set it per-particle via a
    // composite init that stores the update in userData._customUpdate.
    // However, since the pool is shared, we instead assign the update
    // directly on the pool if not already set, or rely on genericUpdate
    // reading from userData. The simplest approach: the pool's update is
    // the genericUpdate + custom dispatch. We store _customUpdate on each
    // particle and the pool runs it.
    //
    // Actually: the pool's update is set to a dispatcher that calls
    // genericUpdate + per-particle _customUpdate. Set it once.
    if (!pool.update) {
        pool.update = (p, dt) => {
            const custom = p.userData._customUpdate as
                | ((p: Particle, dt: number) => void)
                | undefined;
            custom?.(p, dt);
        };
    }

    // Wrap the init to also store the updateFn in userData
    const compositeInit = (p: Parameters<typeof initFn>[0]) => {
        initFn(p);
        p.userData._customUpdate = updateFn;
    };

    return (position: Point3) => {
        pool.burst(options.count, position, compositeInit);
    };
}
