import type { Node } from '@pulse-ts/core';
import type { Object3D } from 'three';

/**
 * Map of nodes to their corresponding Object3D instances.
 */
export class ObjectMap {
    //#region Fields

    private readonly map = new Map<number, Object3D>();

    //#endregion

    //#region Public Methods

    /**
     * Set the object for a given node.
     * @param node The node to set the object for.
     * @param object The object to set.
     */
    set(node: Node, object: Object3D): void {
        this.map.set(node.id, object);
    }

    /**
     * Get the object for a given node.
     * @param node The node to get the object for.
     * @returns The object for the node.
     */
    get(node: Node): Object3D | undefined {
        return this.map.get(node.id);
    }

    /**
     * Check if the map has an object for a given node.
     * @param node The node to check.
     * @returns True if the map has an object for the node; otherwise, false.
     */
    has(node: Node): boolean {
        return this.map.has(node.id);
    }

    /**
     * Delete the object for a given node.
     * @param node The node to delete the object for.
     * @returns The deleted object.
     */
    delete(node: Node): Object3D | undefined {
        const o = this.map.get(node.id);
        this.map.delete(node.id);
        return o;
    }

    /**
     * Clear the map.
     */
    clear(): void {
        this.map.clear();
    }

    /**
     * Get the entries of the map.
     * @returns The entries of the map.
     */
    entries(): IterableIterator<[number, Object3D]> {
        return this.map.entries();
    }

    //#endregion
}
