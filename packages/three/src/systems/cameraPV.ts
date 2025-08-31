import { System } from '@pulse-ts/core';
import type { UpdateKind, UpdatePhase } from '@pulse-ts/core';
import { ThreePlugin } from '../plugin';

/**
 * Pushes Three camera projection-view into the CULLING_CAMERA service.
 */
export class ThreeCameraPVSystem extends System {
    static updateKind: UpdateKind = 'frame';
    static updatePhase: UpdatePhase = 'early';
    static order = Number.MIN_SAFE_INTEGER;

    update(): void {
        if (!this.world) return;

        const plugin = this.world.getSystem(ThreePlugin);
        if (!plugin) return;

        plugin.pushCameraPV();
    }
}
