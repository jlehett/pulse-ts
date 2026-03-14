# Functional Nodes

Functional Nodes (FNs) are functions that create nodes and use hooks for behavior.

```ts
import { useComponent, useFrameUpdate, Transform } from '@pulse-ts/core';

function Player() {
  const transform = useComponent(Transform);

  useFrameUpdate((dt) => {
    transform.localPosition.z += 5 * dt;
  });
}
```

## Lifecycle

- `useInit(fn)` runs on mount; return a cleanup to run on unmount.
- `useDestroy(fn)` runs on node destruction.

## Updates

- `useFixedUpdate(fn)` runs at a fixed rate for simulation.
- `useFrameUpdate(fn)` runs each rendered frame for visuals.
- Early/Late variants control ordering.

## State

- `useState(key, initial)` stores local state on a node.
- `useContext` / `useProvideContext` share values through the node tree (parent → descendants).
- `defineStore` / `useStore` share world-scoped state accessible from any node. See [State Management](/guides/state-management).

## Composition

- `useChild(Fn, props)` creates child nodes.
- Props are plain parameters to your Functional Node.

