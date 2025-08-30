import type { Node } from '../node';

/**
 * The parent change event.
 */
export type ParentChange = {
    /**
     * The node that changed parent.
     */
    node: Node;
    /**
     * The old parent of the node.
     */
    oldParent: Node | null;
    /**
     * The new parent of the node.
     */
    newParent: Node | null;
};

/**
 * The node parent event bus.
 */
export class NodeParentEventBus {
    //#region Fields

    /**
     * The listeners for the parent change event.
     */
    private listeners = new Set<(e: ParentChange) => void>();

    //#endregion

    //#region Public Methods

    /**
     * Adds a listener for the parent change event.
     * @param fn The listener to add.
     * @returns A function to remove the listener.
     */
    on(fn: (e: ParentChange) => void): () => void {
        this.listeners.add(fn);
        return () => this.listeners.delete(fn);
    }

    /**
     * Emits a parent change event.
     * @param node The node that changed parent.
     * @param oldParent The old parent of the node.
     * @param newParent The new parent of the node.
     */
    emit(node: Node, oldParent: Node | null, newParent: Node | null) {
        for (const fn of this.listeners) {
            try {
                fn({ node, oldParent, newParent });
            } catch (e) {
                console.error(e);
            }
        }
    }

    //#endregion
}
