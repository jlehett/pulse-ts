import type { Node } from './node';
import { kVisibility, kVisibilityOwner } from './keys';

/**
 * The visibility of a node.
 */
export class Visibility {
    [kVisibilityOwner]!: Node;
    visible = true;
}

/**
 * Attaches a visibility to a node.
 * @param node The node to attach the visibility to.
 * @returns The visibility.
 */
export function attachVisibility(node: Node): Visibility {
    if ((node as any)[kVisibility]) return (node as any)[kVisibility];
    const v = new Visibility();
    Object.defineProperty(node, kVisibility, { value: v, enumerable: false });
    (v as any)[kVisibilityOwner] = node;
    return v;
}

/**
 * Gets the visibility attached to a node, if any.
 * @param node The node to get the visibility of.
 * @returns The visibility, or undefined if no visibility is attached.
 */
export function maybeGetVisibility(node: Node): Visibility | undefined {
    return (node as any)[kVisibility] as Visibility | undefined;
}
