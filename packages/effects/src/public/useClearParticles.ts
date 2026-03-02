import { useWorld } from '@pulse-ts/core';
import { ParticlesService } from '../domain/ParticlesService';

/**
 * Returns a function that immediately kills all alive particles across
 * every pool. Useful for clearing lingering particles before a scene
 * transition (e.g. entering an instant replay).
 *
 * @returns A no-arg function that clears all particles.
 *
 * @example
 * ```ts
 * const clearParticles = useClearParticles();
 * // On replay start:
 * clearParticles();
 * ```
 */
export function useClearParticles(): () => void {
    const world = useWorld();
    const service = world.getService(ParticlesService);
    return () => service.clearAll();
}
