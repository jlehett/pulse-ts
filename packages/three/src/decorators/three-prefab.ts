import type { Node } from '@pulse-ts/core';
import type { Object3D } from 'three';
import type { ThreeViewContext } from '../utils/types';

const SYMBOL_PREFAB = Symbol('engine:three:prefab');

export type PrefabFactory<N extends Node = Node> = (
    node: N,
    context: ThreeViewContext,
) => Object3D;

/**
 * Optional class decorator:
 * - If applied, ThreePlugin uses this factory to create the node's Object3D.
 * - If absent, but the node has a Transform, the plugin creates an empty Group.
 * @param factory The factory to use to create the node's Object3D.
 * @returns The decorator.
 */
export function threePrefab<N extends Node = Node>(
    factory: PrefabFactory<N>,
): ClassDecorator {
    return function (target: any) {
        Object.defineProperty(target.prototype, SYMBOL_PREFAB, {
            value: factory as PrefabFactory<Node>,
            enumerable: false,
            configurable: false,
            writable: false,
        });
    };
}

/**
 * Get the prefab factory for a given instance.
 * @param instance The instance to get the prefab factory for.
 * @returns The prefab factory for the instance.
 */
export function getPrefab(instance: unknown): PrefabFactory<Node> | null {
    return instance && typeof instance === 'object'
        ? ((instance as any)[SYMBOL_PREFAB] ?? null)
        : null;
}
