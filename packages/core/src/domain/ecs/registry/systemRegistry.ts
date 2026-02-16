import type { System } from '../base/System';
import type { Ctor } from '../base/types';
import { CtorRegistry } from './CtorRegistry';

/**
 * The system registry.
 */
export class SystemRegistry {
    private reg = new CtorRegistry<System>();

    //#region Public Methods

    /**
     * Sets a system.
     * @param systemInstance The system instance.
     */
    set<T extends System>(systemInstance: T): void {
        this.reg.set(systemInstance);
    }

    /**
     * Gets a system.
     * @param System The constructor of the system.
     * @returns The system instance.
     */
    get<T extends System>(
        System: Ctor<T> | ThisParameterType<T>,
    ): T | undefined {
        return this.reg.get(System as any) as T | undefined;
    }

    /**
     * Removes a system.
     * @param System The constructor of the system.
     */
    remove<T extends System>(System: Ctor<T> | ThisParameterType<T>): void {
        this.reg.remove(System as any);
    }

    //#endregion
}
