/**
 * World-level primitives and helpers.
 * Re-exports `World`, ECS base types, and traversal helpers.
 */
export { System } from '../domain/ecs/base/System';
export { Service } from '../domain/ecs/base/Service';
export { Component } from '../domain/ecs/base/Component';
export { Node } from '../domain/ecs/base/node';
export { World, type WorldOptions } from '../domain/world/world';
export {
    getComponent,
    setComponent,
    attachComponent,
} from '../domain/ecs/registry/componentRegistry';
export {
    ancestors,
    descendants,
    traversePreOrder,
    traversePostOrder,
    siblings,
} from '../domain/world/traversal';
