import { TypedEvent } from '../../utils/event';
import type { Node } from '../ecs/node';
import type { ParentChange } from './events';

/**
 * Centralizes parent/child relationships and parent-change events.
 */
export class SceneGraph {
    private parentBus = new TypedEvent<ParentChange>();

    /**
     * Adds a listener to the parent-change event.
     * @param fn The listener function.
     * @returns The listener.
     */
    onParentChanged(fn: (e: ParentChange) => void) {
        return this.parentBus.on(fn);
    }

    /**
     * Reparents a node under a new parent (or null). Handles cross-world moves.
     * @param child The node to reparent.
     * @param newParent The new parent, or null to remove from the parent.
     */
    reparent(child: Node, newParent: Node | null): void {
        if (child === newParent)
            throw new Error('Cannot parent a node to itself.');

        // prevent cycles if newParent is an ancestor of child
        for (let p = newParent; p; p = p.parent) {
            if (p === child)
                throw new Error('Cannot reparent: target is an ancestor.');
        }

        const oldParent = child.parent;
        const oldWorld = child.world;
        const targetWorld = newParent ? newParent.world : oldWorld;

        // unlink from old parent
        if (oldParent) {
            const i = oldParent.children.indexOf(child);
            if (i >= 0) oldParent.children.splice(i, 1);
            child.parent = null;
        }

        // cross-world detach
        if (oldWorld && targetWorld && oldWorld !== targetWorld) {
            oldWorld.remove(child);
        }

        // link under new parent
        if (newParent) {
            newParent.children.push(child);
            child.parent = newParent;
            if (newParent.world) newParent.world.add(child);
        }

        this.parentBus.emit({ node: child, oldParent, newParent });
    }
}
