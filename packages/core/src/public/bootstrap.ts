import { World } from '../domain/world/world';
import { StatsService } from '../domain/services/Stats';
import { CullingSystem } from '../domain/systems/Culling';

/**
 * Installs the default services and systems onto a world.
 *
 * - Adds `StatsService` for performance snapshots.
 * - Adds `CullingSystem` for view-frustum visibility updates.
 *
 * Defaults are opt-in to keep `World` minimal. Call this during setup
 * in apps that expect these features.
 *
 * @param world The world to install defaults into.
 *
 * @example
 * import { World, installDefaults } from '@pulse-ts/core';
 * const world = new World();
 * installDefaults(world);
 */
export function installDefaults(world: World): void {
    world.provideService(new StatsService());
    world.addSystem(new CullingSystem());
}
