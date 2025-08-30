import type { World } from './world';
import type {
    UpdateKind,
    UpdatePhase,
    TickFn,
    TickRegistration,
} from './types';
import {
    kWorldEmitNodeParentChanged,
    kWorldRegisterTick,
    kRegisteredTicks,
    kRegisterTick,
} from './keys';

let NEXT_ID = 1;

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
        // Prevent cycles: if `child` is an ancestor of `this`, reparenting would create a loop
        for (let p: Node | null = this; p; p = p.parent) {
            if (p === child)
                throw new Error('Cannot reparent: target is an ancestor.');
        }

        const oldParent = child.parent;
        const newWorld = this.world;
        const oldWorld = child.world;

        if (oldParent) {
            const i = oldParent.children.indexOf(child);
            if (i >= 0) oldParent.children.splice(i, 1);
            child.parent = null;
        }

        // If moving across worlds, detach first to satisfy World.add() invariants
        if (oldWorld && oldWorld !== newWorld) oldWorld.remove(child);

        this.children.push(child);
        child.parent = this;

        if (newWorld) newWorld.add(child);

        // Emit exactly one event from the most relevant world context
        const emitter = newWorld ?? oldWorld;
        emitter?.[kWorldEmitNodeParentChanged](child, oldParent, this);
        return this;
    }

    /**
     * Removes a child node from this node. Does not remove it from the world.
     * @param child The child node to remove.
     * @returns The node.
     */
    removeChild(child: Node): this {
        const i = this.children.indexOf(child);

        if (i < 0) return this;

        this.children.splice(i, 1);
        const oldParent = this;
        child.parent = null;
        const emitter = this.world ?? child.world;
        emitter?.[kWorldEmitNodeParentChanged](child, oldParent, null);
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

    //#region Internal Methods

    /**
     * Registers a tick function.
     * @param kind The kind of tick.
     * @param phase The phase of the tick.
     * @param fn The tick function.
     * @param order The order of the tick.
     * @returns A function to unregister the tick.
     */
    [kRegisterTick](
        kind: UpdateKind,
        phase: UpdatePhase,
        fn: TickFn,
        order = 0,
    ): () => void {
        if (!this.world)
            throw new Error(
                'Node must be added to a World before registering ticks.',
            );
        const reg = this.world[kWorldRegisterTick](
            this,
            kind,
            phase,
            fn,
            order,
        );
        this[kRegisteredTicks].push(reg);
        return () => reg.dispose();
    }

    //#endregion
}
