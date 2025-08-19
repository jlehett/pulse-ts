import type { NodeConstructor, Node } from './Node';
import { removeNode } from './interfacing/friendSymbols';
import { TagSystem } from './TagSystem';
import type { Module, NodeQuery, QueryResult, Tag } from './types';

/**
 * Base class for a World, which manages Nodes and their lifecycle.
 */
export class World {
    /**
     * The modules that are added to this World.
     */
    protected modules = new Map<string, Module>();

    /**
     * The array of all Nodes within by this World.
     */
    protected nodes: Node[] = [];

    /**
     * Tag system for efficient node querying
     */
    protected tagSystem = new TagSystem();

    /**
     * Indicates whether the World is currently running.
     */
    protected running: boolean = false;
    /**
     * The ID of the current animation frame, if any.
     */
    protected animationFrameId: number | null = null;

    /**
     * Returns whether the World is currently running.
     * @return {boolean} True if the World is running, false otherwise.
     */
    get isRunning(): boolean {
        return this.running;
    }

    /**
     * Adds a module to the World.
     * @param module The module to add to the World
     */
    addModule(moduleKey: string, module: Module) {
        module.onInit(this);
        this.modules.set(moduleKey, module);
    }

    /**
     * Get a module by its key
     * @param moduleKey The key of the module to get
     * @returns The module, or undefined if it is not found
     */
    getModule(moduleKey: string): Module | undefined {
        return this.modules.get(moduleKey);
    }

    /**
     * Starts the World, beginning the update loop.
     */
    start() {
        if (this.isRunning) return;
        this.running = true;

        let lastTime = performance.now();
        const loop = (currentTime: number) => {
            if (!this.isRunning) return;
            const delta = (currentTime - lastTime) / 1000; // Convert to seconds
            lastTime = currentTime;

            this.update(delta);
            this.animationFrameId = requestAnimationFrame(loop);
        };
        this.animationFrameId = requestAnimationFrame(loop);
    }

    /**
     * Stops the World, halting the update loop.
     */
    stop() {
        this.running = false;
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    /**
     * Returns a factory function to create a new node of the specified type
     * and place it in this world.
     *
     * @param NodeClass The class constructor
     * @returns A function that creates a new node of the specified type
     */
    createNode<P, T extends Node>(
        NodeClass: NodeConstructor<P, T>,
        props: P,
    ): T {
        const node = new NodeClass(this, props);
        this.addNode(node);
        return node;
    }

    /**
     * Performs an update on all Nodes in this World.
     *
     * This method is called on each tick of the World to update
     * Nodes based on the time delta since the last update.
     *
     * The delta is capped to a maximum of 100ms to prevent too large
     * deltas that could cause erratic behavior in animations or physics.
     *
     * @param delta The time delta since the last update, in seconds
     */
    protected update(delta: number) {
        const safeDelta = Math.min(delta, 0.1); // cap to 100ms to prevent too large deltas
        for (const node of [...this.nodes]) {
            node.onUpdate(safeDelta);
        }
    }

    /**
     * Adds a given Node to this World.
     *
     * @param node The Node to add to the World.
     */
    protected addNode(node: Node) {
        this.nodes.push(node);
    }

    /**
     * Removes a Node from this World.
     *
     * Does not handle the destruction of the Node itself, nor the severance of
     * its parent-child relationships. This should be handled by the Node itself.
     *
     * @param node The Node to remove from the World.
     */
    protected [removeNode](node: Node) {
        this.nodes = this.nodes.filter((n) => n !== node);
        // Remove from tag system
        this.tagSystem.removeNode(node);
    }

    /**
     * Add tags to a node for querying
     */
    addTags(node: Node, tags: Tag[]): void {
        this.tagSystem.addTags(node, tags);
    }

    /**
     * Remove tags from a node
     */
    removeTags(node: Node, tags: Tag[]): void {
        this.tagSystem.removeTags(node, tags);
    }

    /**
     * Query nodes based on various criteria
     */
    queryNodes(query: NodeQuery): QueryResult {
        return this.tagSystem.query(query);
    }

    /**
     * Get all nodes with a specific tag
     */
    getNodesByTag(tag: Tag): Node[] {
        return this.queryNodes({ tags: [tag] }).nodes;
    }

    /**
     * Get statistics about the tag system
     */
    getTagSystemStats() {
        return this.tagSystem.getStats();
    }
}
