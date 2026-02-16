import { getComponent, attachComponent } from '@pulse-ts/core';
import type { Component } from '@pulse-ts/core';
import type { Node } from '@pulse-ts/core';
import type { Ctor } from '@pulse-ts/core';
import type {
    ComponentSerializer,
    ComponentSerializerAny,
} from '../../public/types';

const ctorToSerializer = new Map<Ctor<Component>, ComponentSerializerAny>();
const idToSerializer = new Map<string, ComponentSerializerAny>();

/**
 * Register a component serializer.
 * @param ctor The component constructor to associate with the serializer.
 * @param serializer The serializer implementation.
 * @example
 * import { registerComponentSerializer } from '@pulse-ts/save';
 * // see ComponentSerializer example in public/types
 */
export function registerComponentSerializer<T extends Component>(
    ctor: Ctor<T>,
    serializer: ComponentSerializer<T>,
) {
    const entry = { ...(serializer as any), ctor } as ComponentSerializerAny;
    ctorToSerializer.set(ctor as unknown as Ctor<Component>, entry);
    idToSerializer.set(serializer.id, entry);
}

export function getSerializerByCtor<T extends Component>(
    ctor: Ctor<T>,
): ComponentSerializerAny | undefined {
    return ctorToSerializer.get(ctor as unknown as Ctor<Component>);
}

/**
 * Get a registered component serializer by its id string.
 */
export function getSerializerById(
    id: string,
): ComponentSerializerAny | undefined {
    return idToSerializer.get(id);
}

/**
 * Serialize all components for which serializers have been registered on the given node.
 * @param owner The node that owns the components.
 * @returns Array of serialized component payloads.
 * @example
 * const items = serializeRegisteredComponents(node);
 * items.forEach(({ type, data }) => console.log(type, data));
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
 * Deserialize and apply component payloads to the given node.
 * Ensures required components exist by attaching them when missing.
 * @param owner The node to mutate.
 * @param items Array of component payloads.
 * @example
 * deserializeComponents(node, [{ type: 'game:health', data: { hp: 50 } }]);
 */
export function deserializeComponents(
    owner: Node,
    items: Array<{ type: string; data: unknown }>,
) {
    for (const item of items) {
        const ser = getSerializerById(item.type);
        if (!ser) continue;
        let comp = getComponent(owner, ser.ctor as any);
        if (!comp) comp = attachComponent(owner, ser.ctor as any);
        ser.deserialize(owner, item.data);
    }
}

/** Internal: test-only reset helper to avoid cross-test contamination. */
export function __resetComponentRegistryForTests() {
    ctorToSerializer.clear();
    idToSerializer.clear();
}
