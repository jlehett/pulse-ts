import { System } from '@pulse-ts/core';
import type { UpdateKind, UpdatePhase } from '@pulse-ts/core';
import { ThreePlugin } from '../plugin';

/**
 * Synchronizes Node TRS into Three Object3D roots each frame before render.
 */
export class ThreeTRSSyncSystem extends System {
    static updateKind: UpdateKind = 'frame';
    static updatePhase: UpdatePhase = 'late';
    static order: number = Number.MAX_SAFE_INTEGER - 2;

    update(): void {
        if (!this.world) return;

        const plugin = this.world.getSystem(ThreePlugin);
        if (!plugin) return;

        plugin.syncTRS();
    }
}
