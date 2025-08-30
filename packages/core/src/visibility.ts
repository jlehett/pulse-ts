import type { Node } from './node';
import { kVisibilityOwner } from './keys';
import {
    createComponentToken,
    ensureComponent,
    getComponent,
} from './components/registry';

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
    const v = ensureComponent(node, VISIBILITY_TOKEN, () => new Visibility());
    (v as any)[kVisibilityOwner] = node;
    return v;
}

/**
 * Gets the visibility attached to a node, if any.
 * @param node The node to get the visibility of.
 * @returns The visibility, or undefined if no visibility is attached.
 */
export function maybeGetVisibility(node: Node): Visibility | undefined {
    return getComponent(node, VISIBILITY_TOKEN);
}

const VISIBILITY_TOKEN = createComponentToken<Visibility>(
    'pulse:component:visibility',
);
