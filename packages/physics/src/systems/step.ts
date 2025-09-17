import { System, type UpdateKind, type UpdatePhase } from '@pulse-ts/core';
import { PhysicsService } from '../services/Physics';

/**
 * Fixed-step physics advancement.
 */
export class PhysicsSystem extends System {
    /** Runs during the fixed update loop. */
    static updateKind: UpdateKind = 'fixed';
    /** Executes in the standard update phase. */
    static updatePhase: UpdatePhase = 'update';
    /** Default system ordering relative to other fixed systems. */
    static order = 0;

    /**
     * Steps the PhysicsService when it is available on the world.
     * @param dt Fixed timestep in seconds.
     */
    update(dt: number): void {
        const svc = this.world?.getService(PhysicsService);
        if (!svc) return;
        svc.step(dt);
    }
}
