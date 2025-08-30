import type { World } from '../world';

/**
 * Minimal contract for systems managed by the World.
 * Systems typically register ticks during attach and dispose them during detach.
 */
export interface System {
    /**
     * Attaches the system to a world.
     * @param world The world to attach the system to.
     */
    attach(world: World): void;

    /**
     * Detaches the system from a world.
     * @param world The world to detach the system from.
     */
    detach?(world: World): void;
}
