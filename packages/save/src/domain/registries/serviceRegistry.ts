import type { World, Service, Ctor } from '@pulse-ts/core';
import { ServiceSerializer, ServiceSerializerAny } from '../../public/types';

const ctorToServiceSer = new Map<Ctor<Service>, ServiceSerializerAny>();
const idToServiceSer = new Map<string, ServiceSerializerAny>();

/**
 * Register a service serializer.
 * @param ctor The service constructor to associate with the serializer.
 * @param serializer The serializer implementation.
 * @example
 * import { registerServiceSerializer } from '@pulse-ts/save';
 * // see ServiceSerializer example in public/types
 */
export function registerServiceSerializer<T extends Service>(
    ctor: Ctor<T>,
    serializer: ServiceSerializer<T>,
) {
    const entry = { ...(serializer as any), ctor } as ServiceSerializerAny;
    ctorToServiceSer.set(ctor as unknown as Ctor<Service>, entry);
    idToServiceSer.set(serializer.id, entry);
}

export function getServiceSerializerByCtor<T extends Service>(
    ctor: Ctor<T>,
): ServiceSerializerAny | undefined {
    return ctorToServiceSer.get(ctor as unknown as Ctor<Service>);
}

/**
 * Get a registered service serializer by its id string.
 */
export function getServiceSerializerById(
    id: string,
): ServiceSerializerAny | undefined {
    return idToServiceSer.get(id);
}

/**
 * Serialize all world services that have registered serializers.
 * @param world The source world.
 * @returns Array of serialized service payloads.
 * @example
 * const items = serializeRegisteredServices(world);
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
 * Apply serialized services to an existing world.
 * This only applies when the target service is already provided by the world.
 * @param world The target world.
 * @param items Array of serialized service payloads.
 * @example
 * deserializeServices(world, [{ type: 'game:my-svc', data: { v: 1 } }]);
 */
export function deserializeServices(
    world: World,
    items: Array<{ type: string; data: unknown }>,
) {
    for (const item of items) {
        const ser = getServiceSerializerById(item.type);
        if (!ser) continue;
        const svc = world.getService(ser.ctor as any);
        if (!svc) continue;
        ser.deserialize(world, item.data);
    }
}

/** Internal: test-only reset helper. */
export function __resetServiceRegistryForTests() {
    ctorToServiceSer.clear();
    idToServiceSer.clear();
}
