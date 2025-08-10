import { v4 as uuidv4 } from 'uuid';
import type { World } from './World';
import { removeNode } from './interfacing/friendSymbols';

/**
 * A factory function type that creates a new Node of type T with the given properties P
 * and places it in the specified World.
 * @template P The type of properties for the Node
 * @template T The type of Node to create
 */
export type NodeConstructor<P, T extends Node> = new (
    world: World,
    props: P,
) => T;

/**
 * Factory function for creating Nodes of a specified type and
 * placing them in a World instance.
 * @template P The properties type for the Node
 * @template T The Node type
 */
export type NodeFactory<P, T extends Node> = (props: P) => T;

/**
 * An abstract class representing a base Node in the PulseTS framework.
 *
 * Nodes are the fundamental building blocks of a PulseTS application,
 * and they can have a parent-child relationship with other Nodes.
 *
 * Nodes can be created within a World, and they can have children Nodes.
 */
export abstract class Node {
    /**
     * The World this Node belongs to.
     */
    protected world: World;
    /**
     * A unique identifier for this Node.
     */
    private _id: string = uuidv4();
    /**
     * The parent Node of this Node, if any.
     */
    private _parent: Node | null = null;
    /**
     * The children Nodes of this Node.
     */
    private _children: Node[] = [];

    /**
     * Returns the unique identifier of this Node.
     */
    get id(): string {
        return this._id;
    }

    /**
     * Returns the parent Node of this Node, or null if it has no parent.
     */
    get parent(): Node | null {
        return this._parent;
    }

    /**
     * Returns a shallow copy of the children Nodes of this Node.
     * This ensures that modifications to the returned array do not affect the original children array.
     */
    get children(): Node[] {
        return [...this._children];
    }

    /**
     * Creates a new Node and adds it as a child of this Node.
     *
     * @param world
     */
    protected constructor(world: World) {
        this.world = world;
    }

    /**
     * Returns a factory function to create a new child node of the specified type and place
     * in this Node's world.
     *
     * @param NodeClass The class constructor
     * @returns A function that creates a new child node of the specified type
     */
    createChild<P, T extends Node>(
        NodeClass: NodeConstructor<P, T>,
    ): NodeFactory<P, T> {
        return (props: P): T => {
            const childNode = this.world.createNode(NodeClass)(props);
            childNode._parent = this;
            this._children.push(childNode);
            return childNode;
        };
    }

    /**
     * Destroys this Node, removing it and all of its children from the World.
     *
     * This method will call `onDestroy` before removing the Node, allowing that lifecycle method
     * to still access the Node and its parent-child relationships.
     */
    destroy() {
        this.onDestroy();
        for (const child of this._children) {
            child.destroy();
        }
        this.world[removeNode](this);
        if (this._parent) {
            this._parent.severChildRelationship(this);
        }
    }

    /**
     * Lifecycle method called when the Node is about to be destroyed.
     *
     * The Node still exists in the World and its parent-child relationships
     * are intact until this method resolves.
     */
    onDestroy(): void {}

    /**
     * Severs the parent-child relationship with the specified child Node.
     *
     * @param child The child Node to sever the relationship with
     */
    protected severChildRelationship(child: Node) {
        if (child._parent !== this) return;
        child._parent = null;
        this._children = this._children.filter((c) => c !== child);
    }
}
