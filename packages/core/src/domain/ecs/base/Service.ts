import type { World } from '../../world/world';

/**
 * A service is a class that provides a functionality to the world.
 */
export abstract class Service {
    /**
     * The world that the service is attached to.
     */
    protected world?: World;

    /**
     * Attaches the service to the world.
     * @param world The world to attach the service to.
     */
    attach(world: World): void {
        this.world = world;
    }

    /**
     * Detaches the service from the world.
     */
    detach(): void {
        this.world = undefined;
    }
}
