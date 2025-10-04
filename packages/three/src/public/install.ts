import type { World } from '@pulse-ts/core';
import { ThreeService, type ThreeOptions } from '../domain/services/Three';
import { ThreeCameraPVSystem } from '../domain/systems/cameraPV';
import { ThreeTRSSyncSystem } from '../domain/systems/trsSync';
import { ThreeRenderSystem } from '../domain/systems/render';

/**
 * Convenience installer for Three.js rendering.
 *
 * - Provides a shared `ThreeService` (renderer + scene + camera).
 * - Installs default systems: `ThreeCameraPVSystem`, `ThreeTRSSyncSystem` (opt-in via options), and `ThreeRenderSystem`.
 *
 * @param world The `World` to install into.
 * @param opts Options to configure the Three service.
 * @returns The created `ThreeService` bound to the world.
 *
 * @example
 * ```ts
 * import { World } from '@pulse-ts/core';
 * import { installThree } from '@pulse-ts/three';
 *
 * const world = new World();
 * const canvas = document.createElement('canvas');
 * const three = installThree(world, { canvas, clearColor: 0x101218 });
 * world.start();
 * ```
 */
export function installThree(world: World, opts: ThreeOptions): ThreeService {
    const svc = world.provideService(new ThreeService(opts));
    world.addSystem(new ThreeCameraPVSystem());
    if (svc.options.autoCommitTransforms) {
        world.addSystem(new ThreeTRSSyncSystem());
    }
    world.addSystem(new ThreeRenderSystem());
    return svc;
}
