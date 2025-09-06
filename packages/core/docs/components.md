# Components

Components attach data/behavior to a `Node`. Core exposes a base `Component` class and helpers to get/set/attach components per node.

```ts
import { Component, attachComponent, getComponent, setComponent } from '@pulse-ts/core';

class Health extends Component {
  hp = 100;
}

const h = attachComponent(node, Health); // creates and stores if missing
console.log(getComponent(node, Health) === h); // true
```

## Built-in components

### Transform

Local TRS with world composition and interpolation. Mutating `localPosition`, `localRotation`, or `localScale` automatically marks the transform dirty and increments the local version.

```ts
import { Transform } from '@pulse-ts/core';

const t = attachComponent(node, Transform);
t.localPosition.set(0, 1, 0);
t.localRotation.y = Math.PI * 0.5;
t.localScale.set(2, 2, 2);

// Query local (optionally interpolated by alpha)
const local = t.getLocalTRS(undefined, /* alpha */ 0.0);

// Query world (composed with parent hierarchy). For alpha>0, interpolation is applied.
const world = t.getWorldTRS();
console.log(world.position, world.rotation, world.scale);

// Convenience accessors compose world TRS with alpha=0 (cached)
console.log(t.worldPosition, t.worldRotation, t.worldScale);
```

World integration:

- The world snapshots `previousLocalPosition/Rotation/Scale` for all transforms before each fixed step. Interpolated queries use these snapshots.
- `getWorldVersion()` increments when the cached world TRS updates for alpha=0; external systems can detect recompositions efficiently.

### Bounds

Local axis-aligned bounds with cached world AABB.

```ts
import { Bounds, createAABB } from '@pulse-ts/core';

const b = attachComponent(node, Bounds);
b.setLocal(new Vec3(-0.5, -0.5, -0.5), new Vec3(0.5, 0.5, 0.5));

// Compute world-space AABB (uses Transform, creates it if missing)
const worldAabb = b.getWorld(); // { min: Vec3, max: Vec3 } | null
```

### Visibility

Boolean flag commonly driven by systems (e.g., culling):

```ts
import { Visibility } from '@pulse-ts/core';
attachComponent(node, Visibility).visible = true;
```

### State

Key/value store used by FC `useState` but also useful directly:

```ts
import { State } from '@pulse-ts/core';
const s = attachComponent(node, State);
s.set('score', 10);
console.log(s.get<number>('score'));
console.log(s.entries());
```

### StableId

Stable string identifier for a node (e.g., save/load mapping):

```ts
import { StableId } from '@pulse-ts/core';
attachComponent(node, StableId).id = 'player-1';
```

## Authoring custom components

```ts
import { Component } from '@pulse-ts/core';

class Timer extends Component {
  elapsed = 0;
}

const timer = attachComponent(node, Timer);
```

`Component.attach(owner)` can be overridden for custom creation logic, but the default works for most cases and ensures ownership is set.

