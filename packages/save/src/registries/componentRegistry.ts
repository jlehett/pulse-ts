import { getComponent, attachComponent } from '@pulse-ts/core';
import type { Component } from '@pulse-ts/core';
import type { Node } from '@pulse-ts/core';
import type { Ctor } from '@pulse-ts/core';
import type { ComponentSerializer, ComponentSerializerAny } from '../types';

/**
 * Map of component constructors to their serializers.
 */
const ctorToSerializer = new Map<Ctor<Component>, ComponentSerializerAny>();

/**
 * Map of component IDs to their serializers.
 */
const idToSerializer = new Map<string, ComponentSerializerAny>();

/**
 * Register a component serializer.
 * @param ctor The constructor of the component to register.
 * @param serializer The serializer to register.
 */
export function registerComponentSerializer<T extends Component>(
    ctor: Ctor<T>,
    serializer: ComponentSerializer<T>,
) {
    const entry = { ...(serializer as any), ctor } as ComponentSerializerAny;
    ctorToSerializer.set(ctor as unknown as Ctor<Component>, entry);
    idToSerializer.set(serializer.id, entry);
}

/**
 * Get a serializer by component constructor.
 * @param ctor The constructor of the component to get the serializer for.
 * @returns The serializer for the component.
 */
export function getSerializerByCtor<T extends Component>(
    ctor: Ctor<T>,
): ComponentSerializerAny | undefined {
    return ctorToSerializer.get(ctor as unknown as Ctor<Component>);
}

/**
 * Get a serializer by component ID.
 * @param id The ID of the component to get the serializer for.
 * @returns The serializer for the component.
 */
export function getSerializerById(
    id: string,
): ComponentSerializerAny | undefined {
    return idToSerializer.get(id);
}

/**
 * Serialize all registered components.
 * @param owner The owner of the components to serialize.
 * @returns An array of serialized components.
 */
export function serializeRegisteredComponents(owner: Node) {
    const out: Array<{ type: string; data: unknown }> = [];
    for (const [ctor, ser] of ctorToSerializer.entries()) {
        const comp = getComponent(owner, ctor as any);
        if (!comp) continue;
        const data = ser.serialize(owner, comp);
        if (data !== undefined) out.push({ type: ser.id, data });
    }
    return out;
}

/**
 * Deserialize all registered components.
 * @param owner The owner of the components to deserialize.
 * @param items An array of serialized components.
 */
export function deserializeComponents(
    owner: Node,
    items: Array<{ type: string; data: unknown }>,
) {
    for (const item of items) {
        const ser = getSerializerById(item.type);
        if (!ser) continue; // unknown component type: skip
        // ensure component exists by attaching if needed
        let comp = getComponent(owner, ser.ctor as any);
        if (!comp) comp = attachComponent(owner, ser.ctor as any);
        ser.deserialize(owner, item.data);
    }
}
