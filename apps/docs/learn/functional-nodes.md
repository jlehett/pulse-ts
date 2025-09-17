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

## Composition

- `useChild(Fn, props)` creates child nodes.
- Props are plain parameters to your Functional Node.

