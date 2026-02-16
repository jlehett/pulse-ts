import type { Node } from '../ecs/base/node';

/**
 * Iterates over the ancestors of a node.
 * @param node The node to iterate over the ancestors of.
 * @returns An iterable of the ancestors of the node.
 */
export function* ancestors(node: Node): Iterable<Node> {
    for (let p = node.parent; p; p = p.parent) yield p;
}

/**
 * Iterates over the descendants of a node.
 * @param root The root node to iterate over the descendants of.
 * @returns An iterable of the descendants of the node.
 */
export function* descendants(root: Node): Iterable<Node> {
    const stack: Node[] = [...root.children].reverse();
    while (stack.length) {
        const n = stack.pop()!;
        yield n;
        for (let i = n.children.length - 1; i >= 0; i--)
            stack.push(n.children[i]!);
    }
}

/**
 * Traverses a node tree in pre-order.
 * @param root The root node to traverse.
 * @param visit The visit function.
 */
export function traversePreOrder(root: Node, visit: (n: Node) => void): void {
    visit(root);
    for (const c of root.children) traversePreOrder(c, visit);
}

/**
 * Traverses a node tree in post-order.
 * @param root The root node to traverse.
 * @param visit The visit function.
 */
export function traversePostOrder(root: Node, visit: (n: Node) => void): void {
    for (const c of root.children) traversePostOrder(c, visit);
    visit(root);
}

/**
 * Iterates over the siblings of a node.
 * @param node The node to iterate over the siblings of.
 * @returns An iterable of the siblings of the node.
 */
export function* siblings(node: Node): Iterable<Node> {
    const p = node.parent;
    if (!p) return;
    for (const c of p.children) if (c !== node) yield c;
}
