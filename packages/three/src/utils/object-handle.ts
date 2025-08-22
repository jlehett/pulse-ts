import type { Object3D } from 'three';

const SYMBOL_OBJECT3D = Symbol('engine:three:object');

export function attachObject3D(node: object, object: Object3D): void {
    Object.defineProperty(node, SYMBOL_OBJECT3D, {
        value: object,
        enumerable: false, configurable: false, writable: false,
    });
}

export function detachObject3D(node: object): void {
    if ((node as any)[SYMBOL_OBJECT3D]) delete (node as any)[SYMBOL_OBJECT3D];
}

export function getObject3D(node: object): Object3D {
    const o = (node as any)[SYMBOL_OBJECT3D] as Object3D | undefined;
    if (!o) throw new Error('Node has no Three Object3D. Is the ThreePlugin attached? Does the node have a Transform or prefab?');
    return o;
}

export function maybeGetObject3D(node: object): Object3D | null {
    return ((node as any)[SYMBOL_OBJECT3D] as Object3D | undefined) ?? null;
}