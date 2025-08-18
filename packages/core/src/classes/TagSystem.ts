import { Tag, NodeQuery, QueryResult } from './types';
import { Node } from './Node';

/**
 * Efficient tag system for node querying using bitmasks and indexing
 */
export class TagSystem {
    private tagToNodes = new Map<Tag, Set<Node>>();
    private nodeToTags = new Map<Node, Set<Tag>>();

    /**
     * Add tags to a node
     */
    addTags(node: Node, tags: Tag[]): void {
        if (!this.nodeToTags.has(node)) {
            this.nodeToTags.set(node, new Set());
        }

        const nodeTags = this.nodeToTags.get(node)!;

        for (const tag of tags) {
            nodeTags.add(tag);

            if (!this.tagToNodes.has(tag)) {
                this.tagToNodes.set(tag, new Set());
            }
            this.tagToNodes.get(tag)!.add(node);
        }
    }

    /**
     * Remove tags from a node
     */
    removeTags(node: Node, tags: Tag[]): void {
        const nodeTags = this.nodeToTags.get(node);
        if (!nodeTags) return;

        for (const tag of tags) {
            nodeTags.delete(tag);
            this.tagToNodes.get(tag)?.delete(node);
        }

        // Clean up empty tag sets
        if (nodeTags.size === 0) {
            this.nodeToTags.delete(node);
        }
    }

    /**
     * Remove a node from all indexes
     */
    removeNode(node: Node): void {
        const nodeTags = this.nodeToTags.get(node);
        if (nodeTags) {
            for (const tag of nodeTags) {
                this.tagToNodes.get(tag)?.delete(node);
            }
            this.nodeToTags.delete(node);
        }
    }

    /**
     * Query nodes based on criteria
     */
    query(query: NodeQuery): QueryResult {
        const startTime = performance.now();
        let candidates: Set<Node> | null = null;

        // Start with tag-based filtering
        if (query.tags && query.tags.length > 0) {
            candidates = this.getNodesByTags(
                query.tags,
                query.requireAllTags ?? false,
            );
        }

        // Apply exclusion filtering
        if (query.excludeTags && query.excludeTags.length > 0) {
            const excludedNodes = this.getNodesByTags(query.excludeTags, false);
            if (candidates) {
                candidates = this.differenceSets(candidates, excludedNodes);
            }
        }

        // If no specific criteria, return all nodes
        if (!candidates) {
            candidates = new Set();
            for (const nodeTags of this.nodeToTags.keys()) {
                candidates.add(nodeTags);
            }
        }

        const nodes = Array.from(candidates);
        const executionTime = performance.now() - startTime;

        return {
            nodes,
            count: nodes.length,
            executionTime,
        };
    }

    /**
     * Get all nodes with specific tags
     */
    private getNodesByTags(tags: Tag[], requireAll: boolean): Set<Node> {
        if (tags.length === 0) return new Set();

        if (requireAll) {
            // AND operation - nodes must have ALL tags
            let result: Set<Node> | null = null;
            for (const tag of tags) {
                const tagNodes = this.tagToNodes.get(tag);
                if (!tagNodes) return new Set(); // No nodes have this tag

                if (result === null) {
                    result = new Set(tagNodes);
                } else {
                    result = this.intersectSets(result, tagNodes);
                }
            }
            return result ?? new Set();
        } else {
            // OR operation - nodes must have ANY tag
            const result = new Set<Node>();
            for (const tag of tags) {
                const tagNodes = this.tagToNodes.get(tag);
                if (tagNodes) {
                    for (const node of tagNodes) {
                        result.add(node);
                    }
                }
            }
            return result;
        }
    }

    /**
     * Set intersection
     */
    private intersectSets<T>(setA: Set<T>, setB: Set<T>): Set<T> {
        const result = new Set<T>();
        for (const item of setA) {
            if (setB.has(item)) {
                result.add(item);
            }
        }
        return result;
    }

    /**
     * Set difference
     */
    private differenceSets<T>(setA: Set<T>, setB: Set<T>): Set<T> {
        const result = new Set<T>();
        for (const item of setA) {
            if (!setB.has(item)) {
                result.add(item);
            }
        }
        return result;
    }

    /**
     * Get statistics about the tag system
     */
    getStats() {
        return {
            totalNodes: this.nodeToTags.size,
            totalTags: this.tagToNodes.size,
            tagDistribution: Object.fromEntries(
                Array.from(this.tagToNodes.entries()).map(([tag, nodes]) => [
                    tag.toString(),
                    nodes.size,
                ]),
            ),
        };
    }
}
