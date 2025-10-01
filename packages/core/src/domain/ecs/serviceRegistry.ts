import type { Service } from './Service';
import type { Ctor } from './types';
import { CtorRegistry } from './registry';

/**
 * The service registry.
 */
export class ServiceRegistry {
    private reg = new CtorRegistry<Service>();

    //#region Public Methods

    /**
     * Sets a service.
     * @param Service The constructor of the service.
     * @param serviceInstance The service instance.
     */
    set<T extends Service>(serviceInstance: T): void {
        this.reg.set(serviceInstance);
    }

    /**
     * Gets a service.
     * @param Service The constructor of the service.
     * @returns The service instance.
     */
    get<T extends Service>(
        Service: Ctor<T> | ThisParameterType<T>,
    ): T | undefined {
        return this.reg.get(Service as any) as T | undefined;
    }

    /**
     * Removes a service.
     * @param Service The constructor of the service.
     */
    remove<T extends Service>(Service: Ctor<T> | ThisParameterType<T>): void {
        this.reg.remove(Service as any);
    }

    //#endregion
}
