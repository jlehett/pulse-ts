# Guide: Save/Load with Stable IDs

Persist and restore your world state using `@pulse-ts/save`. This guide covers two patterns:

- In-place updates with Stable IDs
- Full rebuilds with Functional Nodes wrapped by `withSave`

## 1) Install and register serializers

```ts
import { installSave } from '@pulse-ts/save';

// Optional: include Three serializers when using @pulse-ts/three
installSave(world, { plugins: ['@pulse-ts/three'] });
```

## 2A) In-place updates (Stable IDs)

Use Stable IDs when you want to load data into an existing scene graph without recreating nodes.

```ts
import { useStableId, useComponent, Transform } from '@pulse-ts/core';

function Player() {
  useStableId('player');
  const t = useComponent(Transform);
}
```

Save and load in-place:

```ts
import { saveWorld, loadWorld } from '@pulse-ts/save';

// Save to an object (can be JSON-stringified)
const save = saveWorld(world, { includeTime: true });

// Mutate the world so we can see loading take effect
for (const n of world.nodes) {
  const t = getComponent(n, Transform);
  if (t) t.localPosition.x += 5;
}

// Load back into the existing nodes using Stable IDs
loadWorld(world, save, { applyTime: true, resetPrevious: true });
```

Notes:
- Mark any node you want to target with `useStableId(id)`.
- Provide serializers for your custom components using `registerComponentSerializer`.

## 2B) Full rebuilds (withSave)

Wrap Functional Nodes with `withSave` to record their type and props in the save file. On load, `loadWorldRebuild` will recreate the scene graph by remounting those nodes.

```ts
import { withSave } from '@pulse-ts/save';
import { useComponent, Transform, useFrameUpdate } from '@pulse-ts/core';

// Saveable player FC, auto-registered for rebuild
export const Player = withSave<{ speed: number }>('game:player')(({ speed }) => {
  const t = useComponent(Transform);
  useFrameUpdate((dt) => {
    t.localPosition.z += speed * dt;
  });
});

// Root that mounts the Player with props
export function Game() {
  world.mount(Player, { speed: 2 });
}
```

Save → clear → rebuild:

```ts
import { saveWorld, loadWorldRebuild } from '@pulse-ts/save';

// 1) Save current world (nodes + components + FC metadata)
const save = saveWorld(world, { includeTime: true });

// 2) Rebuild world from save (recreates nodes and hierarchy, reapplies components)
loadWorldRebuild(world, save, { applyTime: true, resetPrevious: true });
```

## 3) End-to-end example

Below is a minimal app demonstrating non-default state saved and reloaded.

```ts
import { World, useComponent, Transform, useInit } from '@pulse-ts/core';
import { withSave, installSave, saveWorld, loadWorldRebuild } from '@pulse-ts/save';

const world = new World();
installSave(world);

// Saveable cube that starts at a custom position
const Cube = withSave<{ startX: number }>('example:cube')(({ startX }) => {
  const t = useComponent(Transform);
  useInit(() => {
    t.localPosition.x = startX; // non-default state
  });
});

// Mount two cubes with different props
world.mount(Cube, { startX: 1 });
world.mount(Cube, { startX: -2 });

// Later: save the world, then rebuild from save
async function saveAndReload() {
  const save = saveWorld(world, { includeTime: true });

  // Simulate destructive change (e.g., clear UI/scene) by rebuilding
  await loadWorldRebuild(world, save, { applyTime: true, resetPrevious: true });
}

world.start();
```

## Choosing a pattern

- **In-place (Stable IDs)**: Load data into an existing world; the node graph remains intact.
- **Rebuild (withSave)**: Recreate the entire scene graph with saved Functional Node types and props.

## Custom component serializers (optional)

To persist your own component data, register serializers:

```ts
import { registerComponentSerializer } from '@pulse-ts/save';
import { Component, attachComponent } from '@pulse-ts/core';

class Health extends Component {
  constructor(public hp = 100) { super(); }
}

registerComponentSerializer(Health, {
  id: 'game:health',
  serialize(_owner, h) {
    return { hp: h.hp };
  },
  deserialize(owner, data: any) {
    const h = attachComponent(owner, Health);
    h.hp = Number(data?.hp ?? 0);
  }
});
```
