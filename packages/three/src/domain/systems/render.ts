import { System } from '@pulse-ts/core';
import type { UpdateKind, UpdatePhase } from '@pulse-ts/core';
import { ThreeService } from '../services/Three';

/**
 * Renders the Three scene each frame.
 *
 * - Runs last in `frame.late` by default.
 * - Consumes renderer, scene, and camera from `ThreeService`.
 *
 * @example
 * ```ts
 * import { World } from '@pulse-ts/core';
 * import { ThreeRenderSystem, ThreeService } from '@pulse-ts/three';
 * const world = new World();
 * world.provideService(new ThreeService({ canvas: document.createElement('canvas') }));
 * world.addSystem(new ThreeRenderSystem());
 * ```
 */
export class ThreeRenderSystem extends System {
    static updateKind: UpdateKind = 'frame';
    static updatePhase: UpdatePhase = 'late';
    static order: number = Number.MAX_SAFE_INTEGER;

    update(): void {
        if (!this.world) return;
        const svc = this.world.getService(ThreeService);
        if (!svc) return;
        svc.renderer.render(svc.scene, svc.camera);
    }
}
