import type { Service } from './Service';
import type { Ctor } from './types';

/**
 * The service registry.
 */
export class ServiceRegistry {
    //#region Fields

    /**
     * The map of services.
     */
    private m = new Map<Ctor<Service> | ThisParameterType<Service>, Service>();

    //#endregion

    //#region Public Methods

    /**
     * Sets a service.
     * @param Service The constructor of the service.
     * @param serviceInstance The service instance.
     */
    set<T extends Service>(serviceInstance: T): void {
        this.m.set(
            serviceInstance.constructor as Ctor<Service>,
            serviceInstance,
        );
    }

    /**
     * Gets a service.
     * @param Service The constructor of the service.
     * @returns The service instance.
     */
    get<T extends Service>(
        Service: Ctor<T> | ThisParameterType<T>,
    ): T | undefined {
        return this.m.get(Service) as T | undefined;
    }

    /**
     * Removes a service.
     * @param Service The constructor of the service.
     */
    remove<T extends Service>(Service: Ctor<T> | ThisParameterType<T>): void {
        this.m.delete(Service);
    }

    //#endregion
}
