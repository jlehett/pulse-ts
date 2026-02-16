import { System } from '@pulse-ts/core';
import { InterpolationService } from '../services/InterpolationService';

/**
 * Smoothly moves transforms toward replicated targets each frame.
 */
export class InterpolationSystem extends System {
    static updateKind: 'frame' | 'fixed' = 'frame';
    static updatePhase: 'early' | 'update' | 'late' = 'update';
    static order = 100; // after NetworkTick

    update(dt: number): void {
        const svc = this.world?.getService(InterpolationService);
        svc?.tick(dt);
    }
}
