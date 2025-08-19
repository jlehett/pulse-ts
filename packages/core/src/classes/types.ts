import type { Node } from './Node';
import type { World } from './World';

/**
 * Tag system for efficient node querying
 */
export type Tag = string | symbol;

/**
 * Query interface for finding nodes
 */
export interface NodeQuery {
    tags?: Tag[];
    requireAllTags?: boolean; // true = AND, false = OR
    excludeTags?: Tag[];
}

/**
 * Query result with metadata
 */
export interface QueryResult<T extends Node = Node> {
    nodes: T[];
    count: number;
    executionTime: number;
}

/**
 * A module that can be added to a World.
 */
export interface Module {
    /**
     * Called when the module is added to a World.
     * @param world The World that the module is being added to
     */
    onInit(world: World): void;
}
