import type { World } from './world';
import type { Node } from './node';
import type { Unsubscribe } from './signals';

/**
 * Live set of Nodes matching a predicate. Stays up-to-date
 * as nodes are added/removed or tags change.
 */
export class Group implements Iterable<Node> {
    private readonly members = new Set<Node>();
    private subscriptions: Unsubscribe[] = [];

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

    private recheck(node: Node): void {
        const currentlyMember = this.members.has(node);
        const shouldBeMember = this.predicate(node);
        if (shouldBeMember && !currentlyMember) this.members.add(node);
        else if (!shouldBeMember && currentlyMember) this.members.delete(node);
    }

    [Symbol.iterator](): Iterator<Node> {
        return this.members.values();
    }
    toArray(): Node[] {
        return Array.from(this.members);
    }
    size(): number {
        return this.members.size;
    }

    /** Stop listening and clear members. */
    destroy(): void {
        this.subscriptions.forEach((unsub) => unsub());
        this.subscriptions = [];
        this.members.clear();
    }
}
