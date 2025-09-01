import type { Node } from '@pulse-ts/core';
import type { Component } from '@pulse-ts/core';
import type { Ctor } from '@pulse-ts/core';

export interface SaveOptions {
    includeTime?: boolean;
}

export interface LoadOptions {
    strict?: boolean; // fail if a node is missing
    resetPrevious?: boolean; // reset Transform previous values when applying
    applyTime?: boolean; // apply saved time state
}

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

export type ComponentSerializerAny = ComponentSerializer<Component> & {
    ctor: Ctor<Component>;
};

export type SaveNodeRecord = {
    id: number;
    parent: number | null;
    components: Array<{ type: string; data: unknown }>;
};

export type SaveFileV1 = {
    version: 1;
    time?: { timeScale: number; paused: boolean };
    nodes: SaveNodeRecord[];
};

export type SaveFile = SaveFileV1; // future versions can union here
