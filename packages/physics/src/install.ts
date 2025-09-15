import type { World } from '@pulse-ts/core';
import { PhysicsService } from './services/Physics';
import { PhysicsSystem } from './systems/step';
import type { PhysicsOptions } from './types';

/**
 * Convenience installer for @pulse-ts/physics.
 */
export function installPhysics(world: World, opts: PhysicsOptions = {}): PhysicsService {
    const svc = world.provideService(new PhysicsService(opts));
    world.addSystem(new PhysicsSystem());
    return svc;
}

