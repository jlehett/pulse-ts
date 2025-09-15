import { System, type UpdateKind, type UpdatePhase } from '@pulse-ts/core';
import { PhysicsService } from '../services/Physics';

/**
 * Fixed-step physics advancement.
 */
export class PhysicsSystem extends System {
    static updateKind: UpdateKind = 'fixed';
    static updatePhase: UpdatePhase = 'update';
    static order = 0;

    update(dt: number): void {
        const svc = this.world?.getService(PhysicsService);
        if (!svc) return;
        svc.step(dt);
    }
}

