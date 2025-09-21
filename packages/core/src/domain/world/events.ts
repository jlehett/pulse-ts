import type { Node } from '../ecs/node';

/**
 * The parent change event.
 */
export type ParentChange = {
    /**
     * The node that changed parent.
     */
    node: Node;
    /**
     * The old parent of the node.
     */
    oldParent: Node | null;
    /**
     * The new parent of the node.
     */
    newParent: Node | null;
};
