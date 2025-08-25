import type { World } from './world';
import { nextIdentifier } from './ids';
import {
    internal_indexTagAdd,
    internal_indexTagRemove,
    internal_notifyParentChanged,
} from './world';

/**
 * Base object that can live inside a World.
 * - Optional parent/children relationship
 * - Tagging for lightweight grouping and queries
 * - Override lifecycle hooks as needed
 */
export class Node {
    //#region Fields

    /* Unique identifier for the node. */
    readonly id: number = nextIdentifier();

    /* World that the node is in. */
    world: World | null = null;

    /* Parent node. */
    parent: Node | null = null;

    /* Any child nodes. */
    children: Set<Node> = new Set();

    /* All tags on the node. */
    private readonly tagSet: Set<string> = new Set();

    /**
     * All tags on the node.
     * @returns A read-only set of tags.
     */
    get tags(): ReadonlySet<string> {
        return this.tagSet;
    }

    //#endregion

    /**
     * Create a new Node.
     * @param world The World to add the node to.
     */
    constructor(world?: World) {
        this.world = world ?? null;
    }

    //#region Lifecycle Methods

    /**
     * Called after the node is added to a World. Override as needed.
     */
    protected onAddedToWorld(): void {}

    /**
     * Called after the node is removed from a World. Override as needed.
     */
    protected onRemovedFromWorld(): void {}

    //#endregion

    //#region Public Methods

    /**
     * Add a child node to this node.
     * @param child The child node to add.
     * @returns The created child node.
     */
    addChild(child: Node): this {
        // Remove from any previous parent
        const previousParent = child.parent;
        if (previousParent) previousParent.removeChild(child);

        // Add to this node
        this.children.add(child);

        // Ensure parent is set on the child
        child.parent = this;

        // Adopt child into the same world as the parent
        if (this.world) this.world.add(child);

        // Notify the world that a parent has changed
        this.world?.[internal_notifyParentChanged](child, previousParent, this);

        // Return the child node
        return this;
    }

    /**
     * Remove a child node from this node.
     * @param child The child node to remove.
     * @returns The node.
     */
    removeChild(child: Node): this {
        // If the child is not a child of this node, no-op
        if (!this.children.has(child)) return this;

        // Remove the child from this node
        this.children.delete(child);

        // Notify the world that a parent has changed
        this.world?.[internal_notifyParentChanged](child, child.parent, null);

        // Remove the parent reference from the child
        child.parent = null;

        // Remove the child from the world
        if (this.world) this.world.remove(child);

        // Return the node
        return this;
    }

    /**
     * Add a tag to the node.
     * @param tag The tag to add.
     * @returns The node.
     */
    addTag(tag: string): this {
        // If the tag is not already on the node, add it and notify the world
        if (!this.tagSet.has(tag)) {
            this.tagSet.add(tag);
            this.world?.[internal_indexTagAdd](this, tag);
        }

        // Return the node
        return this;
    }

    /**
     * Remove a tag from the node.
     * @param tag The tag to remove.
     * @returns The node.
     */
    removeTag(tag: string): this {
        // If the tag is on the node, remove it and notify the world
        if (this.tagSet.delete(tag)) {
            this.world?.[internal_indexTagRemove](this, tag);
        }

        // Return the node
        return this;
    }

    /**
     * Check if the node has a tag.
     * @param tag The tag to check for.
     * @returns True if the node has the tag; otherwise, false.
     */
    hasTag(tag: string): boolean {
        return this.tagSet.has(tag);
    }

    /**
     * Remove the node from the world.
     */
    destroy(): void {
        this.world?.remove(this);
    }

    //#endregion
}
