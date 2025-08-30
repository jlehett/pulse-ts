import type { System } from '@pulse-ts/core';
import type { World } from '@pulse-ts/core';
import type { ThreePlugin } from '../plugin';

/**
 * Synchronizes Node TRS into Three Object3D roots each frame before render.
 */
export class ThreeTRSSyncSystem implements System {
    private tick?: { dispose(): void };

    constructor(
        private plugin: ThreePlugin,
        private order = Number.MAX_SAFE_INTEGER - 2,
    ) {}

    attach(world: World): void {
        this.tick = world.registerSystemTick(
            'frame',
            'late',
            (dt) => {
                this.plugin.syncTRS();
            },
            this.order,
        );
    }

    detach(): void {
        this.tick?.dispose();
        this.tick = undefined;
    }
}
