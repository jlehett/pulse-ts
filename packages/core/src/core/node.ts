import type { World } from './world';
import { nextIdentifier } from './ids';

/**
 * Base object that can live inside a World.
 * - Optional parent/children relationship
 * - Tagging for lightweight grouping and queries
 * - Override lifecycle hooks as needed
 */
export class Node {
    readonly id: number = nextIdentifier();
    world: World | null = null;

    parent: Node | null = null;
    children: Set<Node> = new Set();

    private readonly tagSet: Set<string> = new Set();
    get tags(): ReadonlySet<string> {
        return this.tagSet;
    }

    /** Called after the node is added to a World. */
    protected onAddedToWorld(): void {}

    /** Called after the node is removed from a World. */
    protected onRemovedFromWorld(): void {}

    addChild(child: Node): this {
        if (child.parent) child.parent.removeChild(child);
        this.children.add(child);
        child.parent = this;
        if (this.world) this.world.add(child); // adopt into the same world
        return this;
    }

    removeChild(child: Node): this {
        if (this.children.delete(child)) {
            child.parent = null;
            if (this.world) this.world.remove(child);
        }
        return this;
    }

    addTag(tag: string): this {
        if (!this.tagSet.has(tag)) {
            this.tagSet.add(tag);
            this.world?._indexTagAdd(this, tag);
        }
        return this;
    }

    removeTag(tag: string): this {
        if (this.tagSet.delete(tag)) {
            this.world?._indexTagRemove(this, tag);
        }
        return this;
    }

    hasTag(tag: string): boolean {
        return this.tagSet.has(tag);
    }

    /** Convenience for removing from the world. */
    destroy(): void {
        this.world?.remove(this);
    }
}
