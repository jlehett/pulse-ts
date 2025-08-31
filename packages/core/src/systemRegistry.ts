import type { System } from './System';
import type { Ctor } from './types';

/**
 * The system registry.
 */
export class SystemRegistry {
    //#region Fields

    /**
     * The map of systems.
     */
    private m = new Map<Ctor<System> | ThisParameterType<System>, System>();

    //#endregion

    //#region Public Methods

    /**
     * Sets a system.
     * @param systemInstance The system instance.
     */
    set<T extends System>(systemInstance: T): void {
        this.m.set(systemInstance.constructor as Ctor<System>, systemInstance);
    }

    /**
     * Gets a system.
     * @param System The constructor of the system.
     * @returns The system instance.
     */
    get<T extends System>(
        System: Ctor<T> | ThisParameterType<T>,
    ): T | undefined {
        return this.m.get(System) as T | undefined;
    }

    /**
     * Removes a system.
     * @param System The constructor of the system.
     */
    remove<T extends System>(System: Ctor<T> | ThisParameterType<T>): void {
        this.m.delete(System);
    }

    //#endregion
}
