import type { World } from './world';
import type { TickRegistration } from './types';
import { kRegisteredTicks } from './keys';

let NEXT_ID = 1;

/**
 * A Node is an entity in the scene graph.
 *
 * - Nodes form parent/child hierarchies.
 * - Components attach to nodes to hold data/state.
 * - Ticks registered on a node run according to the world's update loop.
 *
 * Example:
 * ```ts
 * const world = new World();
 * const parent = world.add(new Node());
 * const child = world.add(new Node());
 * parent.addChild(child);
 * ```
 */
export class Node {
    //#region Fields

    readonly id = NEXT_ID++;
    world: World | null = null;

    parent: Node | null = null;
    children: Node[] = [];

    [kRegisteredTicks]: TickRegistration[] = [];

    //#endregion

    //#region Public Methods

    /**
     * Adds a child node to this node.
     * @param child The child node to add.
     * @returns The node.
     */
    addChild(child: Node): this {
        if (child === this) throw new Error('Cannot parent a node to itself.');
        if (this.world) {
            this.world.reparent(child, this);
            return this;
        }
        // Local tree change (no world yet)
        for (let p: Node | null = this; p; p = p.parent) {
            if (p === child)
                throw new Error('Cannot reparent: target is an ancestor.');
        }
        if (child.parent) {
            const i = child.parent.children.indexOf(child);
            if (i >= 0) child.parent.children.splice(i, 1);
            child.parent = null;
        }
        // detach from other world if exists
        if (child.world && child.world !== this.world)
            child.world.remove(child);
        this.children.push(child);
        child.parent = this;
        return this;
    }

    /**
     * Removes a child node from this node. Does not remove it from the world.
     * @param child The child node to remove.
     * @returns The node.
     */
    removeChild(child: Node): this {
        if (this.world) {
            this.world.reparent(child, null);
            return this;
        }
        const i = this.children.indexOf(child);
        if (i >= 0) this.children.splice(i, 1);
        if (child.parent === this) child.parent = null;
        return this;
    }

    /**
     * Destroys the node and its subtree.
     */
    destroy(): void {
        for (const c of [...this.children]) c.destroy();
        this.onDestroy?.();
        if (this.parent) this.parent.removeChild(this);
        this.world?.remove(this);
        // hard-unlink ticks O(1)
        for (const r of this[kRegisteredTicks]) {
            try {
                r.dispose();
            } catch {}
        }
        this[kRegisteredTicks].length = 0;
    }

    /**
     * Called when the node is initialized.
     */
    onInit?(): void;

    /**
     * Called when the node is destroyed.
     */
    onDestroy?(): void;

    //#endregion
}
