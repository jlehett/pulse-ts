# Queries

Iterate nodes that have specific components (and optionally exclude others) with type-safe helpers.

Overview
- `defineQuery([A, B], { not: [C] })` returns a reusable query you can run against any world.
- Results are tuples like `[node, a, b]` where `a` is the `A` instance, `b` is `B`.
- Use `query(world, [A, B])` for one-off scans.
- Use `world.query([A, B])` sugar to create a bound query object for the world.

Quickstart
```ts
import { World, defineQuery, Transform, Bounds } from '@pulse-ts/core';

const world = new World();
// ... populate world with nodes + components ...

const HasTRSB = defineQuery([Transform, Bounds]);
for (const [node, t, b] of HasTRSB.run(world)) {
  // node has Transform (t) and Bounds (b)
}

// Using the one-off helper
import { query } from '@pulse-ts/core';
for (const [node, t] of query(world, [Transform])) {}

// Using world-bound sugar
const Q = world.query([Transform]);
for (const [node, t] of Q.run()) {}
```

Limitations / Trade-offs
- Current implementation scans `world.nodes` each time `run` is called. This keeps the API simple.
- Future versions may add internal indexes transparently to optimize queries.
- Prefer reusing a query (via `defineQuery` or the `world.query` sugar) when running repeatedly.

