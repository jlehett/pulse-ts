# Quickstart

Get up and running with Pulse in minutes.

## Install

```bash
npm install @pulse-ts/core
```

Optional packages:

```bash
npm install @pulse-ts/input @pulse-ts/three @pulse-ts/network @pulse-ts/save
```

## Create a world

```ts
import { World } from '@pulse-ts/core';

const world = new World();
```

## Your first Functional Node

```ts
import { useFrameUpdate, useComponent, Transform } from '@pulse-ts/core';

function Mover() {
  const transform = useComponent(Transform);

  useFrameUpdate((dt) => {
    transform.localPosition.x += 1 * dt; // move 1 unit/second
  });
}
```

## Mount and run

```ts
world.mount(Mover);
world.start();
```

That’s it. You now have a running world with a node that moves every frame.

## Next steps

- Read the [Core Concepts](/learn/core-concepts)
- Learn [Functional Nodes](/learn/functional-nodes)
- Understand the [Update Loop](/learn/update-loop)
- Try the guide: [Camera + Controls + Render](/guides/camera-controls-render)
