import type { World } from '@pulse-ts/core';
import { PhysicsService } from '../domain/services/PhysicsService';
import { PhysicsSystem } from '../domain/systems/PhysicsSystem';
import type { PhysicsOptions } from '../domain/types';

/**
 * Convenience installer for @pulse-ts/physics.
 *
 * @param world The game `World` to install the physics service and system into.
 * @param opts Optional {@link PhysicsOptions} used to configure the service (e.g., gravity and grid cell size).
 * @returns The created and registered {@link PhysicsService} instance.
 *
 * @example
 * ```ts
 * const physics = installPhysics(world, { gravity: { x: 0, y: -9.81, z: 0 } });
 * ```
 */
export function installPhysics(
    world: World,
    opts: PhysicsOptions = {},
): PhysicsService {
    const svc = world.provideService(new PhysicsService(opts));
    world.addSystem(new PhysicsSystem());
    return svc;
}
