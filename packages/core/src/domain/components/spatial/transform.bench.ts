/**
 * Transform microbenchmarks.
 *
 * Measures two categories of cost:
 *
 * 1. **Property mutation** — direct writes to `localPosition` / `localRotation`
 *    fields, which currently go through a JS `Proxy` setter (see `makeDirtyVec3` /
 *    `makeDirtyQuat` in Transform.ts). This is the primary suspect for poor
 *    performance in the platformer demo. TICKET-1 aims to remove the Proxy; use
 *    this bench as a before/after comparison.
 *
 * 2. **World TRS recomputation** — cost of `getWorldTRS()` in both the dirty
 *    (cache-miss) and clean (cache-hit) cases, for flat nodes and a 4-level
 *    hierarchy.
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
// Property mutation — Proxy setter cost (TICKET-1 target)
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
// World TRS recomputation — cache-miss vs cache-hit
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
