import type { World } from './world';
import type {
    UpdateKind,
    UpdatePhase,
    TickFn,
    TickRegistration,
} from './types';
import { __worldRegisterTick } from './world';

let NEXT_ID = 1;

const registeredTicks = Symbol('pulse:node:registeredTicks');
export const registerTick = Symbol('pulse:node:registerTick');

export class Node {
    readonly id = NEXT_ID++;
    world: World | null = null;

    parent: Node | null = null;
    children: Node[] = [];

    [registeredTicks]: TickRegistration[] = [];

    /**
     * Adds a child node to this node.
     * @param child The child node to add.
     * @returns The node.
     */
    addChild(child: Node): this {
        if (child.parent) child.parent.removeChild(child);
        this.children.push(child);
        child.parent = this;
        if (this.world) this.world.add(child);
        return this;
    }

    /**
     * Removes a child node from this node.
     * @param child The child node to remove.
     * @returns The node.
     */
    removeChild(child: Node): this {
        const i = this.children.indexOf(child);
        if (i >= 0) this.children.splice(i, 1);
        child.parent = null;
        return this;
    }

    /**
     * Destroys the node.
     */
    destroy(): void {
        for (const c of [...this.children]) c.destroy();
        this.onDestroy?.();
        if (this.parent) this.parent.removeChild(this);
        this.world?.remove(this);
        this[registeredTicks].forEach((r) => (r.active = false));
        this[registeredTicks].length = 0;
    }

    /**
     * Called when the node is initialized.
     */
    onInit?(): void;

    /**
     * Called when the node is destroyed.
     */
    onDestroy?(): void;

    /**
     * Registers a tick function.
     * @param kind The kind of tick.
     * @param phase The phase of the tick.
     * @param fn The tick function.
     * @param order The order of the tick.
     * @returns A function to unregister the tick.
     */
    [registerTick](
        kind: UpdateKind,
        phase: UpdatePhase,
        fn: TickFn,
        order = 0,
    ): () => void {
        if (!this.world)
            throw new Error(
                'Node must be added to a World before registering ticks.',
            );
        const reg = this.world[__worldRegisterTick](
            this,
            kind,
            phase,
            fn,
            order,
        );
        this[registeredTicks].push(reg);
        return () => {
            reg.active = false;
        };
    }
}
