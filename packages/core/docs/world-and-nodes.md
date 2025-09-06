# World & Nodes

The World drives the engine loop (fixed and frame updates), manages a set of live Nodes, and hosts systems and services.

## World lifecycle

```ts
import { World } from '@pulse-ts/core';

const world = new World({
  fixedStepMs: 1000 / 60,     // default 16.666ms
  maxFixedStepsPerFrame: 8,   // cap catch-up work
  maxFrameDtMs: 250           // clamp long frames
});

world.start();  // schedules the loop (RAF in browser / timeout in Node)
// world.stop();
// world.tick(16.67); // manual stepping (advanced/testing)
```

Time controls:

```ts
world.pause();
world.resume();
world.setTimeScale(0.5); // slow motion
console.log(world.getTimeScale());

console.log(world.getFrameId());     // monotonically increasing frame index
console.log(world.getAmbientAlpha()); // 0..1 fraction of fixed step during frame updates
console.log(world.getPerf());         // { fps, fixedSps }
```

## Nodes and tree

Nodes form a parent/child tree owned by the World.

```ts
import { World, Node } from '@pulse-ts/core';

const world = new World();
const root = new Node();
world.add(root);

const child = new Node();
root.addChild(child); // auto-attaches to same world

// Reparent
world.reparent(child, null);   // detach from root
world.reparent(child, root);   // reattach

// Destroying a node removes its subtree from the world
root.destroy();

// Or clear all user roots (keeps internal system node)
world.clearScene();
```

You can observe parent changes globally:

```ts
const off = world.onNodeParentChanged(({ node, oldParent, newParent }) => {
  // react to hierarchy changes
});
// off(); // unsubscribe
```

Traversal helpers:

```ts
import {
  ancestors,
  descendants,
  traversePreOrder,
  traversePostOrder,
  siblings
} from '@pulse-ts/core';

for (const a of ancestors(child)) {}
for (const d of descendants(root)) {}
traversePreOrder(root, n => {/* ... */});
traversePostOrder(root, n => {/* ... */});
for (const s of siblings(child)) {}
```

## Registering ticks programmatically

While the FC hooks are ergonomic, you can directly register ticks on a Node:

```ts
import { World, Node } from '@pulse-ts/core';

const world = new World();
const n = world.add(new Node());

// Run every fixed update, early phase, order 0
const reg = world.registerTick(n, 'fixed', 'early', (dt) => {
  // simulation work here
}, /* order */ 0);

// Later, disable or dispose
reg.active = false; // temporarily
reg.dispose();      // permanently

// Globally enable/disable phases or node
world.setPhaseEnabled('frame', 'late', false);
world.setNodeTicksEnabled(n, false);
```

## Engine loop model

- Fixed updates: fixed.early -> fixed.update -> fixed.late (0..N times per frame).
- Frame updates: frame.early -> frame.update -> frame.late (once per render frame).
- `getAmbientAlpha()` returns the 0..1 fraction of the current frame's accumulation into the next fixed step; use it to interpolate visuals between fixed snapshots.
