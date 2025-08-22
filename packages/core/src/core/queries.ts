import type { World } from './world';
import type { Node } from './node';
import { Group } from './group';
import { UpdatePhase, type UpdateKind, hasTick } from '../capabilities/tick';
import { hasTransform } from '../capabilities/transform';

export const byTag = (tag: string) => (node: Node) => node.hasTag(tag);
export const byPhase = (kind: UpdateKind, phase: UpdatePhase) => (node: Node) =>
    hasTick(node, kind, phase);
export const withTransform = () => (node: Node) => hasTransform(node);

/** Live group of nodes that carry a specific tag. */
export function groupByTag(world: World, tag: string): Group {
    return world.group(byTag(tag));
}

/** Live group of nodes that participate in a specific phase and kind. */
export function groupByUpdate(
    world: World,
    kind: UpdateKind,
    phase: UpdatePhase,
): Group {
    return world.group(byPhase(kind, phase));
}

/** Live group of nodes that have a Transform. */
export function groupWithTransform(world: World): Group {
    return world.group(withTransform());
}