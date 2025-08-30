import type { System } from '@pulse-ts/core';
import type { World } from '@pulse-ts/core';
import type { ThreePlugin } from '../plugin';

/**
 * Pushes Three camera projection-view into the CULLING_CAMERA service.
 */
export class ThreeCameraPVSystem implements System {
    private tick?: { dispose(): void };

    constructor(
        private plugin: ThreePlugin,
        private order = Number.MIN_SAFE_INTEGER,
    ) {}

    attach(world: World): void {
        this.tick = world.registerSystemTick(
            'frame',
            'early',
            () => {
                this.plugin.pushCameraPV();
            },
            this.order,
        );
    }

    detach(): void {
        this.tick?.dispose();
        this.tick = undefined;
    }
}
