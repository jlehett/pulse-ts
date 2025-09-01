import type { Node } from '@pulse-ts/core';
import type { Component } from '@pulse-ts/core';
import type { Service } from '@pulse-ts/core';
import type { Ctor } from '@pulse-ts/core';

/**
 * Options for saving a world.
 */
export interface SaveOptions {
    /** The version of the save file; defaults to 1. */
    version?: number;
    /** Whether to include the time state in the save file. */
    includeTime?: boolean;
}

/**
 * Options for loading a world.
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
