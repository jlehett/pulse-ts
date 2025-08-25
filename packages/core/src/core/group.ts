import type { World } from './world';
import type { Node } from './node';
import type { Unsubscribe } from './signals';

/**
 * Live set of Nodes matching a predicate. Stays up-to-date
 * as nodes are added/removed or tags change.
 */
export class Group implements Iterable<Node> {
    //#region Fields

    /* All Nodes that match the predicate. */
    private readonly members = new Set<Node>();

    /* Subscriptions to signals that keep the group up-to-date. */
    private subscriptions: Unsubscribe[] = [];

    //#endregion

    /**
     * Create a new Group.
     * @param world The World to watch.
     * @param predicate The predicate to match nodes against.
     */
    constructor(
        private readonly world: World,
        private readonly predicate: (node: Node) => boolean,
    ) {
        // Seed from current nodes
        for (const node of (world as any).nodes.values() as Iterable<Node>) {
            if (predicate(node)) this.members.add(node);
        }
        // React to changes
        this.subscriptions.push(
            world.onNodeAdded.subscribe((node) => {
                if (predicate(node)) this.members.add(node);
            }),
            world.onNodeRemoved.subscribe((node) => {
                this.members.delete(node);
            }),
            world.onTagAdded.subscribe(({ node }) => this.recheck(node)),
            world.onTagRemoved.subscribe(({ node }) => this.recheck(node)),
        );
    }

    //#region Public Methods

    /**
     * Iterate over the nodes in the group.
     * @returns An iterator over the nodes in the group.
     */
    [Symbol.iterator](): Iterator<Node> {
        return this.members.values();
    }

    /**
     * Convert the group to an array.
     * @returns An array of the nodes in the group.
     */
    toArray(): Node[] {
        return Array.from(this.members);
    }

    /**
     * Get the number of nodes in the group.
     * @returns The number of nodes in the group.
     */
    size(): number {
        return this.members.size;
    }

    /**
     * Stop listening and clear members.
     */
    destroy(): void {
        this.subscriptions.forEach((unsub) => unsub());
        this.subscriptions = [];
        this.members.clear();
    }

    //#endregion

    //#region Private Methods

    /**
     * Recheck whether a node should be in the group or not. If it should be, ensure it
     * is added to the group. If it should not be, ensure it is removed from the group.
     * @param node The node to recheck.
     */
    private recheck(node: Node): void {
        const currentlyMember = this.members.has(node);
        const shouldBeMember = this.predicate(node);
        if (shouldBeMember && !currentlyMember) this.members.add(node);
        else if (!shouldBeMember && currentlyMember) this.members.delete(node);
    }

    //#endregion
}
