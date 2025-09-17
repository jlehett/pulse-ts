import type { World, Service, Ctor } from '@pulse-ts/core';
import { ServiceSerializer, ServiceSerializerAny } from '../types';

/**
 * A map of service constructors to their serializers.
 */
const ctorToServiceSer = new Map<Ctor<Service>, ServiceSerializerAny>();

/**
 * A map of service ids to their serializers.
 */
const idToServiceSer = new Map<string, ServiceSerializerAny>();

/**
 * Register a service serializer.
 * @param ctor The constructor of the service to register.
 * @param serializer The serializer for the service.
 */
export function registerServiceSerializer<T extends Service>(
    ctor: Ctor<T>,
    serializer: ServiceSerializer<T>,
) {
    const entry = { ...(serializer as any), ctor } as ServiceSerializerAny;
    ctorToServiceSer.set(ctor as unknown as Ctor<Service>, entry);
    idToServiceSer.set(serializer.id, entry);
}

/**
 * Get a service serializer by its constructor.
 * @param ctor The constructor of the service to get the serializer for.
 * @returns The serializer for the service.
 */
export function getServiceSerializerByCtor<T extends Service>(
    ctor: Ctor<T>,
): ServiceSerializerAny | undefined {
    return ctorToServiceSer.get(ctor as unknown as Ctor<Service>);
}

/**
 * Get a service serializer by its id.
 * @param id The id of the service to get the serializer for.
 * @returns The serializer for the service.
 */
export function getServiceSerializerById(
    id: string,
): ServiceSerializerAny | undefined {
    return idToServiceSer.get(id);
}

/**
 * Serialize all registered services.
 * @param world The world to serialize the services for.
 * @returns An array of serialized services.
 */
export function serializeRegisteredServices(world: World) {
    const out: Array<{ type: string; data: unknown }> = [];
    for (const [ctor, ser] of ctorToServiceSer.entries()) {
        const svc = world.getService(ctor as any);
        if (!svc) continue;
        const data = ser.serialize(world, svc);
        if (data !== undefined) out.push({ type: ser.id, data });
    }
    return out;
}

/**
 * Deserialize all registered services.
 * @param world The world to deserialize the services for.
 * @param items An array of serialized services.
 */
export function deserializeServices(
    world: World,
    items: Array<{ type: string; data: unknown }>,
) {
    for (const item of items) {
        const ser = getServiceSerializerById(item.type);
        if (!ser) continue;
        // Only apply if service exists; creation is left to the app.
        const svc = world.getService(ser.ctor as any);
        if (!svc) continue;
        ser.deserialize(world, item.data);
    }
}
