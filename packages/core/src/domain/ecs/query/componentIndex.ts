// Internal query index: maps Component constructors to the set of Nodes
// that currently have an instance attached. Also tracks the reverse mapping
// to unlink efficiently on node destruction.

import type { ComponentCtor } from '../base/types';

type NodeLike = import('../base/node').Node;

const index = new Map<ComponentCtor, Set<NodeLike>>();
const reverse = new WeakMap<NodeLike, Set<ComponentCtor>>();

/** Registers a node under a component constructor. */
export function registerComponent(owner: NodeLike, Ctor: ComponentCtor): void {
    let set = index.get(Ctor);
    if (!set) {
        set = new Set<NodeLike>();
        index.set(Ctor, set);
    }
    set.add(owner);
    let rev = reverse.get(owner);
    if (!rev) {
        rev = new Set<ComponentCtor>();
        reverse.set(owner, rev);
    }
    rev.add(Ctor);
}

/** Removes a node from all component sets it was registered with. */
export function removeNode(owner: NodeLike): void {
    const rev = reverse.get(owner);
    if (!rev) return;
    for (const Ctor of rev) {
        const set = index.get(Ctor);
        if (set) set.delete(owner);
    }
    reverse.delete(owner);
}

/** Returns candidate nodes for a component constructor. */
export function candidates(
    Ctor: ComponentCtor,
): ReadonlySet<NodeLike> | undefined {
    return index.get(Ctor);
}
