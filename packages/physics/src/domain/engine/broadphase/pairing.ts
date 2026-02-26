import { Collider } from '../../../public/components/Collider';
import { computeAABB } from './aabb';

/**
 * Finds potential collider pairs using a uniform spatial grid.
 *
 * Each collider is inserted into every cell its AABB spans; pairs sharing a
 * cell are candidates for narrow-phase testing. Infinite-extent colliders
 * (planes) are inserted last and paired against every other collider.
 *
 * The O(n²) naive fallback has been intentionally removed. Returning zero
 * pairs is the correct result when no AABBs overlap — falling back to all-pairs
 * was generating up to n*(n-1)/2 spurious narrow-phase tests every step in
 * scenes where bodies are spread apart (e.g. a settled 100-body simulation
 * produces 4950 wasted narrow-phase calls with the fallback).
 */
export function findPairs(
    colliders: Iterable<Collider>,
    cellSize: number,
): Array<[Collider, Collider]> {
    if (!isFinite(cellSize) || cellSize <= 0) return naivePairs(colliders);

    // Map<numericCellKey, Collider[]>
    // Cell key packs (x,y,z) — each biased by +0x8000 to handle negatives —
    // into a single JS number, collision-free for cell coords in [-32768, 32767].
    const buckets = new Map<number, Collider[]>();
    const planes: Collider[] = [];

    for (const c of colliders) {
        const bb = computeAABB(c);
        if (!bb) {
            if (c.kind === 'plane') planes.push(c);
            continue;
        }
        const minx = Math.floor(bb.min.x / cellSize);
        const miny = Math.floor(bb.min.y / cellSize);
        const minz = Math.floor(bb.min.z / cellSize);
        const maxx = Math.floor(bb.max.x / cellSize);
        const maxy = Math.floor(bb.max.y / cellSize);
        const maxz = Math.floor(bb.max.z / cellSize);
        for (let x = minx; x <= maxx; x++)
            for (let y = miny; y <= maxy; y++)
                for (let z = minz; z <= maxz; z++) {
                    const key = ((x + 0x8000) * 0x10000 + (y + 0x8000)) * 0x10000 + (z + 0x8000);
                    let list = buckets.get(key);
                    if (!list) buckets.set(key, (list = []));
                    list.push(c);
                }
    }

    // Deduplicate using a numeric Set — triangular encoding: lo + hi*(hi+1)/2
    // gives a unique key for any ordered pair of non-negative integers.
    const seen = new Set<number>();
    const pairs: Array<[Collider, Collider]> = [];

    for (const list of buckets.values()) {
        for (let i = 0; i < list.length; i++)
            for (let j = i + 1; j < list.length; j++) {
                const a = list[i]!;
                const b = list[j]!;
                const lo = a.owner.id < b.owner.id ? a.owner.id : b.owner.id;
                const hi = a.owner.id < b.owner.id ? b.owner.id : a.owner.id;
                const key = lo + (hi * (hi + 1)) / 2;
                if (seen.has(key)) continue;
                seen.add(key);
                pairs.push([a, b]);
            }
    }

    // Planes are infinite so they never land in a grid cell; pair each against
    // every non-plane collider explicitly.
    if (planes.length) {
        const all = [...colliders];
        for (const pl of planes) {
            for (const o of all) {
                if (o === pl) continue;
                const lo = pl.owner.id < o.owner.id ? pl.owner.id : o.owner.id;
                const hi = pl.owner.id < o.owner.id ? o.owner.id : pl.owner.id;
                const key = lo + (hi * (hi + 1)) / 2;
                if (seen.has(key)) continue;
                seen.add(key);
                pairs.push([pl, o]);
            }
        }
    }

    return pairs;
}

function naivePairs(
    colliders: Iterable<Collider>,
): Array<[Collider, Collider]> {
    const arr = [...colliders];
    const out: Array<[Collider, Collider]> = [];
    for (let i = 0; i < arr.length; i++)
        for (let j = i + 1; j < arr.length; j++) out.push([arr[i]!, arr[j]!]);
    return out;
}
