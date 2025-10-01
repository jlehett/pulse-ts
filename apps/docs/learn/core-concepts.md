# Core Concepts

Pulse is an ECS (Entity Component System) runtime. Learn the core building blocks:

## World
The container that owns time, the scene graph, systems, and services. Create one world per app.

- Manage lifecycle with `start()`, `stop()`, and `tick(dtMs)`.
- Clean the scene with `clearScene()` (preserves internal system nodes).
- Query stats via `getPerf()` or `StatsService`.

## Nodes
Entities in the scene graph. Nodes form parent/child hierarchies and hold components.

## Components
Pure data attached to nodes (e.g., `Transform`, `Visibility`, your own). No logic.

## Systems
Logic that operates over components. Systems run during the update loop.

## Services
Singleton utilities (e.g., input, audio, networking). Accessed via hooks or the world.

## Functional Nodes
Functions that create nodes and use hooks for lifecycle and updates. See [Functional Nodes](/learn/functional-nodes).

## Queries
Iterate nodes that have components (and optionally exclude others) with type-safe helpers.

```ts
import { World, defineQuery, Transform, Bounds } from '@pulse-ts/core';

const world = new World();
// ... populate world with nodes/components ...

const HasTRSB = defineQuery([Transform, Bounds]);
for (const [node, t, b] of HasTRSB.run(world)) {
  // node has Transform (t) and Bounds (b)
}
```
