import type { ServiceKey } from '../keys';

/**
 * The service registry.
 */
export class ServiceRegistry {
    //#region Fields

    /**
     * The map of services.
     */
    private m = new Map<symbol, any>();

    //#endregion

    //#region Public Methods

    /**
     * Sets a service.
     * @param key The key of the service.
     * @param service The service.
     */
    set<T>(key: ServiceKey<T>, service: T): void {
        this.m.set(key, service);
    }

    /**
     * Gets a service.
     * @param key The key of the service.
     * @returns The service.
     */
    get<T>(key: ServiceKey<T>): T | undefined {
        return this.m.get(key) as T | undefined;
    }

    //#endregion
}
