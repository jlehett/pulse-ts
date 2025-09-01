import { System } from '@pulse-ts/core';
import type { UpdateKind, UpdatePhase } from '@pulse-ts/core';
import { ThreeService } from '../services/Three';

/**
 * Renders the Three scene each frame.
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
