import type { World } from './world';
import type { Node } from './node';
import { Group } from './group';
import { UpdatePhase, type UpdateKind, hasTick } from '../capabilities/tick';
import { hasTransform } from '../capabilities/transform';

/**
 * Live group of nodes that carry a specific tag.
 * @param world The World to query.
 * @param tag The tag to query for.
 * @returns A Group of nodes that carry the specified tag.
 */
export function groupByTag(world: World, tag: string): Group {
    return world.group((node: Node) => node.hasTag(tag));
}

/**
 * Live group of nodes that participate in a specific phase and kind of tick.
 * @param world The World to query.
 * @param kind The kind of tick to query for.
 * @param phase The phase of tick to query for.
 * @returns A Group of nodes that participate in the specified phase and kind of tick.
 */
export function groupByUpdate(
    world: World,
    kind: UpdateKind,
    phase: UpdatePhase,
): Group {
    return world.group((node: Node) => hasTick(node, kind, phase));
}

/**
 * Live group of nodes that have a Transform.
 * @param world The World to query.
 * @returns A Group of nodes that have a Transform.
 */
export function groupWithTransform(world: World): Group {
    return world.group((node: Node) => hasTransform(node));
}
