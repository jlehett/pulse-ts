# @pulse-ts/core

Core of the `@pulse-ts` game engine: world loop, node graph, components, systems, services, events, traversal, math, and a small function-component (FC) API with hooks.

- Status: Work in progress
- Root docs: [../../README.md](../../README.md)

## Quick Start

Install (if consuming externally):

```bash
npm install @pulse-ts/core
```

Create a world, mount a component, and start the loop:

```ts
import {
  World,
  mount,
  useInit,
  useFrameUpdate,
  useComponent,
  Transform,
} from '@pulse-ts/core';

const world = new World();

function Spinner() {
  // Ensure a Transform exists for this node
  const t = useComponent(Transform);

  // Initialize once
  useInit(() => {
    t.localPosition.set(0, 1, 0);
  });

  // Animate every frame
  useFrameUpdate((dt) => {
    t.localRotation.y += dt; // rotate 1 radian/sec around Y
  });
}

mount(world, Spinner, {});
world.start();
```

## What’s In Core

- World and Loop: fixed+frame pipeline, time scaling, pause/resume.
- Nodes and Tree: parent/child relationships, traversal utilities.
- Components: attach to nodes; built-ins include Transform, Bounds, Visibility, State, StableId.
- Systems and Services: world-level behaviors and singletons.
- FC + Hooks: ergonomic way to create nodes and register ticks.
- Events: `TypedEvent` and `EventBus`.
- Math: minimal `Vec3` and `Quat`.

See the detailed guides:

- World & Nodes: [docs/world-and-nodes.md](docs/world-and-nodes.md)
- Functional Components & Hooks: [docs/functional-components.md](docs/functional-components.md)
- Components (Transform, Bounds, Visibility, State, StableId): [docs/components.md](docs/components.md)
- Systems & Services (incl. Culling, Stats): [docs/services-and-systems.md](docs/services-and-systems.md)
- Events & Traversal: [docs/events-and-traversal.md](docs/events-and-traversal.md)
- Math (Vec3, Quat): [docs/math.md](docs/math.md)
- Ticks & Time: [docs/ticks-and-time.md](docs/ticks-and-time.md)

## API Surface

From `@pulse-ts/core`:

- World: `World`, `WorldOptions`
- Tree: `Node`, traversal helpers (`ancestors`, `descendants`, `traversePreOrder`, `traversePostOrder`, `siblings`)
- Components: `Component`, registries (`getComponent`, `setComponent`, `attachComponent`)
- Built-in Components: `Transform`, `Bounds`, `Visibility`, `State`, `StableId`
- Systems/Services: `System`, `Service`, `CullingSystem`, `CullingCamera`, `StatsService`
- Events: `TypedEvent`, `EventBus`
- FC: `mount`, `FC`, hooks (`useWorld`, `useNode`, `useInit`, `useDestroy`, `useComponent`, `useFixedEarly`, `useFixedUpdate`, `useFixedLate`, `useFrameEarly`, `useFrameUpdate`, `useFrameLate`, `useChild`, `useState`, `useStableId`)
- Math: `Vec3`, `Quat`

For details and examples, open the docs linked above.

