import type { World } from '@pulse-ts/core';
import { ThreeService, type ThreeOptions } from './services/Three';
import { ThreeCameraPVSystem } from './systems/cameraPV';
import { ThreeTRSSyncSystem } from './systems/trsSync';
import { ThreeRenderSystem } from './systems/render';

/**
 * Convenience installer: provides ThreeService and registers default systems.
 * Returns the created ThreeService instance.
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
