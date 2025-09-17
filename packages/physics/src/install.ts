import type { World } from '@pulse-ts/core';
import { PhysicsService } from './services/Physics';
import { PhysicsSystem } from './systems/step';
import type { PhysicsOptions } from './types';

/**
 * Convenience installer for @pulse-ts/physics.
 *
 * @example
 * ```ts
 * const physics = installPhysics(world, { gravity: { x: 0, y: -9.81, z: 0 } });
 * ```
 */
export function installPhysics(world: World, opts: PhysicsOptions = {}): PhysicsService {
    const svc = world.provideService(new PhysicsService(opts));
    world.addSystem(new PhysicsSystem());
    return svc;
}
