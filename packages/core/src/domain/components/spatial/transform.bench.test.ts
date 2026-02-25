/**
 * Transform microbenchmarks.
 *
 * Measures two categories of cost:
 *
 * 1. **Property mutation** — direct writes to `localPosition` / `localRotation`
 *    fields, which currently go through a JS `Proxy` setter (see `makeDirtyVec3` /
 *    `makeDirtyQuat` in Transform.ts). This is the primary suspect for poor
 *    performance in the platformer demo. TICKET-003 aims to remove the Proxy; use
 *    this bench as a before/after comparison.
 *
 * 2. **World TRS recomputation** — cost of `getWorldTRS()` in both the dirty
 *    (cache-miss) and clean (cache-hit) cases, for flat nodes and a 4-level
 *    hierarchy.
 *
 * Batch variants (sections marked "at scale") loop over N pre-built entities to
 * simulate a system that updates all moving objects per frame. Single-op benches
 * run sub-microsecond and hide the aggregate cost; batch benches surface it.
 *
 * Run with: npm run bench -w packages/core
 */
import { describe, bench } from 'vitest';
import { World } from '../../world/world';
import { Node } from '../../ecs/base/node';
import { attachComponent } from '../../ecs/registry/componentRegistry';
import { Transform } from './Transform';

// ---------------------------------------------------------------------------
// Flat node — no parent, simplest possible hierarchy
// ---------------------------------------------------------------------------
const flatWorld = new World();
const flatNode = flatWorld.add(new Node());
const flatT = attachComponent(flatNode, Transform);

// ---------------------------------------------------------------------------
// 4-level hierarchy: grandparent → parent → child → grandchild
// Tests full ancestry traversal during world matrix recomputation.
// ---------------------------------------------------------------------------
const hierWorld = new World();
const gpNode = hierWorld.add(new Node());
const pNode = hierWorld.add(new Node());
const cNode = hierWorld.add(new Node());
const gcNode = hierWorld.add(new Node());
gpNode.addChild(pNode);
pNode.addChild(cNode);
cNode.addChild(gcNode);
const gpT = attachComponent(gpNode, Transform);
attachComponent(pNode, Transform);
attachComponent(cNode, Transform);
const gcT = attachComponent(gcNode, Transform);

// Initialise hierarchy so there's a valid cached world TRS to start from.
gpT.setLocal({ position: { x: 1, y: 0, z: 0 } });
gcT.getWorldTRS(undefined, 0);

// ---------------------------------------------------------------------------
// Batch pools — flat nodes used for per-frame system simulations.
// Built once at module load; reused across all batch bench iterations.
// ---------------------------------------------------------------------------

/** 100 flat Transform instances for batch mutation/recompute benches. */
const batch100World = new World();
const batch100Transforms: Transform[] = [];
for (let i = 0; i < 100; i++) {
    const node = batch100World.add(new Node());
    batch100Transforms.push(attachComponent(node, Transform));
}

/** 1,000 flat Transform instances for batch mutation/recompute benches. */
const batch1kWorld = new World();
const batch1kTransforms: Transform[] = [];
for (let i = 0; i < 1_000; i++) {
    const node = batch1kWorld.add(new Node());
    batch1kTransforms.push(attachComponent(node, Transform));
}

// ---------------------------------------------------------------------------
// Property mutation — Proxy setter cost, single op (TICKET-003 target)
//
// Each bench writes to a Proxy-wrapped Vec3 or Quat property. V8 de-optimises
// Proxy traps from hot loops; this cost scales with the number of moving entities.
// ---------------------------------------------------------------------------
describe('Transform — property mutation (Proxy overhead)', () => {
    bench('localPosition.x = value', () => {
        flatT.localPosition.x = 1.0;
    });

    bench('localPosition.set(x, y, z)', () => {
        flatT.localPosition.set(1.0, 2.0, 3.0);
    });

    bench('localRotation.w = value', () => {
        flatT.localRotation.w = 1.0;
    });

    bench('setLocal({ position })', () => {
        flatT.setLocal({ position: { x: 1, y: 2, z: 3 } });
    });
});

// ---------------------------------------------------------------------------
// Property mutation — batch (simulates a system updating N entities per frame)
//
// Single-op benches run sub-microsecond and hide the aggregate Proxy cost.
// These variants loop over N entities as a physics or animation system would,
// making the frame-budget impact visible and giving TICKET-003 a clear signal.
// ---------------------------------------------------------------------------
describe('Transform — property mutation, batch (Proxy overhead at scale)', () => {
    bench('localPosition.x = value — 100 entities', () => {
        for (const t of batch100Transforms) {
            t.localPosition.x = 1.0;
        }
    });

    bench('localPosition.x = value — 1 000 entities', () => {
        for (const t of batch1kTransforms) {
            t.localPosition.x = 1.0;
        }
    });

    bench('setLocal({ position }) — 100 entities', () => {
        for (const t of batch100Transforms) {
            t.setLocal({ position: { x: 1, y: 2, z: 3 } });
        }
    });

    bench('setLocal({ position }) — 1 000 entities', () => {
        for (const t of batch1kTransforms) {
            t.setLocal({ position: { x: 1, y: 2, z: 3 } });
        }
    });
});

// ---------------------------------------------------------------------------
// World TRS recomputation — cache-miss vs cache-hit, single node
//
// getWorldTRS() caches the result keyed on ancestry version. A mutation
// increments the version and forces a recompute on the next call.
// ---------------------------------------------------------------------------
describe('Transform — getWorldTRS, flat node', () => {
    bench('dirty recompute (mutation before each call)', () => {
        // setLocal() increments _localVersion, invalidating the cache.
        flatT.setLocal({ position: { x: 1 } });
        flatT.getWorldTRS(undefined, 0);
    });

    bench('cache hit (no mutation)', () => {
        flatT.getWorldTRS(undefined, 0);
    });
});

describe('Transform — getWorldTRS, 4-level hierarchy', () => {
    bench('dirty recompute (root mutation propagates to leaf)', () => {
        // Dirtying the root forces the full chain to recompute when
        // the leaf's getWorldTRS is called.
        gpT.setLocal({ position: { x: 1 } });
        gcT.getWorldTRS(undefined, 0);
    });

    bench('cache hit (no mutation)', () => {
        gcT.getWorldTRS(undefined, 0);
    });
});

// ---------------------------------------------------------------------------
// World TRS recomputation — batch dirty (simulates a render system reading
// world positions for N entities that were all mutated this frame)
//
// Pattern: mutate all → read all. This is the worst-case frame pattern for
// the dirty-tracking cache and the realistic cost the renderer pays each tick.
// ---------------------------------------------------------------------------
describe('Transform — dirty recompute, batch (flat nodes)', () => {
    bench('mutate + recompute — 100 entities', () => {
        for (const t of batch100Transforms) {
            t.setLocal({ position: { x: 1 } });
        }
        for (const t of batch100Transforms) {
            t.getWorldTRS(undefined, 0);
        }
    });

    bench('mutate + recompute — 1 000 entities', () => {
        for (const t of batch1kTransforms) {
            t.setLocal({ position: { x: 1 } });
        }
        for (const t of batch1kTransforms) {
            t.getWorldTRS(undefined, 0);
        }
    });
});
