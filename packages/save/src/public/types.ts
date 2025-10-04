import type { Node } from '@pulse-ts/core';
import type { Component } from '@pulse-ts/core';
import type { Service } from '@pulse-ts/core';
import type { Ctor } from '@pulse-ts/core';

/**
 * Options for saving a world.
 * @example
 * import { saveWorld } from '@pulse-ts/save';
 * const save = saveWorld(world, { includeTime: true, version: 1 });
 */
export interface SaveOptions {
    /** The version of the save file; defaults to 1. */
    version?: number;
    /** Whether to include the time state in the save file. */
    includeTime?: boolean;
}

/**
 * Options for loading a world.
 * @example
 * import { loadWorld } from '@pulse-ts/save';
 * loadWorld(world, save, { strict: false, applyTime: true, resetPrevious: true });
 */
export interface LoadOptions {
    /**
     * Whether to fail if a node is missing when loading a save file in-place.
     */
    strict?: boolean;
    /** Whether to reset the previous values of the Transform component when applying. */
    resetPrevious?: boolean;
    /** Whether to apply the saved time state. */
    applyTime?: boolean;
}

/**
 * A serializer for a component.
 * @example
 * import { registerComponentSerializer } from '@pulse-ts/save';
 * import { Component, attachComponent } from '@pulse-ts/core';
 * class Health extends Component { constructor(public hp = 100) { super(); } }
 * registerComponentSerializer(Health, {
 *   id: 'game:health',
 *   serialize(_owner, h) { return { hp: h.hp }; },
 *   deserialize(owner, data: any) { attachComponent(owner, Health).hp = Number(data?.hp ?? 0); },
 * });
 */
export type ComponentSerializer<T extends Component> = {
    /** Stable identifier for this component type in save files. */
    id: string;
    /**
     * Serialize the component into JSON-safe data.
     * Return undefined to skip writing this component.
     */
    serialize(owner: Node, comp: T): unknown | undefined;
    /** Apply the serialized data back onto the component. */
    deserialize(owner: Node, data: unknown): void;
};

/**
 * A serializer for a component that includes the constructor.
 */
export type ComponentSerializerAny = ComponentSerializer<Component> & {
    /** The constructor of the component. */
    ctor: Ctor<Component>;
};

/**
 * A record of a node in the save file.
 */
export type SaveNodeRecord = {
    /** The unique ID of the node. */
    id: number;
    /** The parent ID of the node. */
    parent: number | null;
    /** The components of the node. */
    components: Array<{ type: string; data: unknown }>;
    /** Optional function-component descriptor for re-mounting in rebuild mode. */
    fc?: { type: string; props?: unknown };
};

/**
 * A save file.
 * @example
 * import { saveWorld } from '@pulse-ts/save';
 * const save = saveWorld(world);
 * localStorage.setItem('save', JSON.stringify(save));
 */
export type SaveFile = {
    /** The version of the save file. */
    version: number;
    /** The time state of the world. */
    time?: { timeScale: number; paused: boolean };
    /** Serialized services. */
    services: Array<{ type: string; data: unknown }>;
    /** The nodes of the world. */
    nodes: SaveNodeRecord[];
};

/**
 * A serializer for a service.
 * @example
 * import { registerServiceSerializer } from '@pulse-ts/save';
 * import { Service } from '@pulse-ts/core';
 * class MySvc extends Service { value = 0; }
 * registerServiceSerializer(MySvc, {
 *   id: 'game:my-svc',
 *   serialize(_world, s) { return { v: s.value }; },
 *   deserialize(world, data: any) { const s = world.getService(MySvc); if (s) s.value = Number(data?.v ?? 0); },
 * });
 */
export type ServiceSerializer<T extends Service> = {
    /** Stable identifier for this service in save files. */
    id: string;
    /** Serialize the service into JSON-safe data. */
    serialize(world: any, svc: T): unknown | undefined;
    /** Apply the serialized data back onto the service in the world. */
    deserialize(world: any, data: unknown): void;
};

/** Any service serializer with attached ctor. */
export type ServiceSerializerAny = ServiceSerializer<Service> & {
    ctor: Ctor<Service>;
};
