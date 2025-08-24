import type { Node } from '@pulse-ts/core';
import type { Object3D } from 'three';

export class ObjectMap {
    private readonly map = new Map<number, Object3D>();

    set(node: Node, object: Object3D): void {
        this.map.set(node.id, object);
    }

    get(node: Node): Object3D | undefined {
        return this.map.get(node.id);
    }

    has(node: Node): boolean {
        return this.map.has(node.id);
    }

    delete(node: Node): Object3D | undefined {
        const o = this.map.get(node.id);
        this.map.delete(node.id);
        return o;
    }

    clear(): void {
        this.map.clear();
    }

    entries(): IterableIterator<[number, Object3D]> {
        return this.map.entries();
    }
}