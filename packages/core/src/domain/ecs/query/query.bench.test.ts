/**
 * ECS query microbenchmarks.
 *
 * Measures the cost of iterating `defineQuery().run(world)` across entity counts
 * representative of small, medium, and large scenes (100 / 1k / 10k).
 *
 * The component index is module-level shared state, so all three worlds below
 * exist in the same index simultaneously. Each query uses `world.nodes.has(n)`
 * to isolate results per-world, so correctness is preserved; the iteration cost
 * accurately reflects single-world usage for the given entity count.
 *
 * Run with: npm run bench -w packages/core
 */
import { describe, bench } from 'vitest';
import { World } from '../../world/world';
import { Node } from '../base/node';
import { attachComponent } from '../registry/componentRegistry';
import { Transform } from '../../components/spatial/Transform';
import { Bounds } from '../../components/spatial/Bounds';
import { defineQuery } from './defineQuery';

// Pre-defined queries — created once and reused across all bench iterations.
// defineQuery() itself is O(1); cost is purely in run().
const SINGLE_Q = defineQuery([Transform]);
const DOUBLE_Q = defineQuery([Transform, Bounds]);

function makeWorld(n: number): World {
    const world = new World();
    for (let i = 0; i < n; i++) {
        const node = world.add(new Node());
        attachComponent(node, Transform);
        // Half the nodes also have Bounds, giving the two-component query
        // something realistic to filter against.
        if (i % 2 === 0) attachComponent(node, Bounds);
    }
    return world;
}

// Worlds are constructed in ascending order so the component index candidate
// sets grow incrementally. The 100-entity bench runs against an index that
// contains exactly 100 nodes; the 1k bench against 1,100; the 10k against 11,100.
const w100 = makeWorld(100);
const w1k = makeWorld(1_000);
const w10k = makeWorld(10_000);

// ---------------------------------------------------------------------------
// Single-component query — `[Transform]`
// Iterates the Transform candidate set filtered to each world's node set.
// ---------------------------------------------------------------------------
describe('ECS query — single component (Transform)', () => {
    bench('100 entities', () => {
        SINGLE_Q.run(w100);
    });

    bench('1 000 entities', () => {
        SINGLE_Q.run(w1k);
    });

    bench('10 000 entities', () => {
        SINGLE_Q.run(w10k);
    });
});

// ---------------------------------------------------------------------------
// Two-component query — `[Transform, Bounds]`
// Uses the smaller candidate set (Bounds, present on ~half of entities).
// Measures the extra per-node `getComponent` lookup for the second component.
// ---------------------------------------------------------------------------
describe('ECS query — two components (Transform + Bounds)', () => {
    bench('100 entities', () => {
        DOUBLE_Q.run(w100);
    });

    bench('1 000 entities', () => {
        DOUBLE_Q.run(w1k);
    });

    bench('10 000 entities', () => {
        DOUBLE_Q.run(w10k);
    });
});
