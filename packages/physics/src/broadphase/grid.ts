import { Vec3, getComponent, Transform } from '@pulse-ts/core';
import { Collider } from '../components/Collider';

export interface AABB { min: Vec3; max: Vec3 }

export type AABBFn = (c: Collider) => AABB | null;

/**
 * Uniform grid broadphase producing de-duplicated candidate pairs.
 */
export function gridPairs(colliders: Iterable<Collider>, cellSize: number, computeAABB: AABBFn): Array<[Collider, Collider]> {
    if (!isFinite(cellSize) || cellSize <= 0) return naivePairs(colliders);
    type CellKey = string;
    const buckets = new Map<CellKey, Collider[]>();
    for (const c of colliders) {
        const bb = computeAABB(c);
        if (!bb) continue;
        const minx = Math.floor(bb.min.x / cellSize);
        const miny = Math.floor(bb.min.y / cellSize);
        const minz = Math.floor(bb.min.z / cellSize);
        const maxx = Math.floor(bb.max.x / cellSize);
        const maxy = Math.floor(bb.max.y / cellSize);
        const maxz = Math.floor(bb.max.z / cellSize);
        for (let x = minx; x <= maxx; x++)
            for (let y = miny; y <= maxy; y++)
                for (let z = minz; z <= maxz; z++) {
                    const key = `${x},${y},${z}`;
                    let list = buckets.get(key);
                    if (!list) buckets.set(key, (list = []));
                    list.push(c);
                }
    }
    const set = new Set<string>();
    const pairs: Array<[Collider, Collider]> = [];
    for (const list of buckets.values()) {
        for (let i = 0; i < list.length; i++)
            for (let j = i + 1; j < list.length; j++) {
                const a = list[i]!;
                const b = list[j]!;
                const ai = a.owner.id;
                const bi = b.owner.id;
                const key = ai < bi ? `${ai}|${bi}` : `${bi}|${ai}`;
                if (set.has(key)) continue;
                set.add(key);
                pairs.push([a, b]);
            }
    }
    return pairs.length === 0 ? naivePairs(colliders) : pairs;
}

export function naivePairs(colliders: Iterable<Collider>): Array<[Collider, Collider]> {
    const arr = [...colliders];
    const out: Array<[Collider, Collider]> = [];
    for (let i = 0; i < arr.length; i++)
        for (let j = i + 1; j < arr.length; j++) out.push([arr[i]!, arr[j]!]);
    return out;
}

