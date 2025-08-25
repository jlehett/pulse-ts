import type { Object3D } from 'three';

const SYMBOL_OBJECT3D = Symbol('engine:three:object');

/**
 * Attach an object to a node.
 * @param node The node to attach the object to.
 * @param object The object to attach to the node.
 */
export function attachObject3D(node: object, object: Object3D): void {
    Object.defineProperty(node, SYMBOL_OBJECT3D, {
        value: object,
        enumerable: false,
        configurable: false,
        writable: false,
    });
}

/**
 * Detach an object from a node.
 * @param node The node to detach the object from.
 */
export function detachObject3D(node: object): void {
    if ((node as any)[SYMBOL_OBJECT3D]) delete (node as any)[SYMBOL_OBJECT3D];
}

/**
 * Get the object attached to a node.
 * @param node The node to get the object from.
 * @returns The object attached to the node.
 */
export function getObject3D(node: object): Object3D {
    const o = (node as any)[SYMBOL_OBJECT3D] as Object3D | undefined;
    if (!o)
        throw new Error(
            'Node has no Three Object3D. Is the ThreePlugin attached? Does the node have a Transform or prefab?',
        );
    return o;
}

/**
 * Get the object attached to a node if it exists.
 * @param node The node to get the object from.
 * @returns The object attached to the node if it exists; otherwise, null.
 */
export function maybeGetObject3D(node: object): Object3D | null {
    return ((node as any)[SYMBOL_OBJECT3D] as Object3D | undefined) ?? null;
}
