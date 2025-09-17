import { UpdateKind, UpdatePhase } from './types';
import type { World } from './world';

/**
 * A system is a behavior that is run on every tick of the specified phase and kind
 * for a world, and is registered on the world's system node.
 */
export abstract class System {
    /**
     * The kind of update that this system is registered for.
     * Defaults to 'fixed'.
     */
    static updateKind?: UpdateKind;

    /**
     * The phase of the update that this system is registered for.
     * Defaults to 'update'.
     */
    static updatePhase?: UpdatePhase;

    /**
     * The order of the update that this system is registered for.
     */
    static order?: number;

    private tick?: { dispose(): void };

    /**
     * The world that the system is attached to.
     */
    protected world?: World;

    /**
     * Attaches the system to the world.
     * @param world The world to attach the system to.
     */
    attach(world: World): void {
        this.world = world;

        // Read statics from the concrete subclass, not from System itself
        const C = this.constructor as typeof System;

        this.tick = world.registerSystemTick(
            C.updateKind ?? 'fixed',
            C.updatePhase ?? 'update',
            (dt) => this.update(dt),
            C.order,
        );
    }

    /**
     * Detaches the system from the world.
     */
    detach(): void {
        this.tick?.dispose();
        this.tick = undefined;
        this.world = undefined;
    }

    /**
     * Method that will be called on every tick that this system is registered for.
     */
    abstract update(dt: number): void;
}
