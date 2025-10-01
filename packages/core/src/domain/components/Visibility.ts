import { Component } from '../ecs/Component';

/**
 * The visibility of a node.
 *
 * - Typically managed by `CullingSystem` based on camera frustum.
 *
 * @example
 * ```ts
 * import { World, Node, Visibility } from '@pulse-ts/core';
 * const w = new World();
 * const n = w.add(new Node());
 * const v = Visibility.attach(n);
 * v.visible = false;
 * ```
 */
export class Visibility extends Component {
    visible = true;
}
