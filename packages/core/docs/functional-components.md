# Functional Components & Hooks

Core ships a tiny function-component (FC) API to make composing behavior easy without a heavy UI runtime.

## Mounting an FC

```ts
import { World, mount } from '@pulse-ts/core';

const world = new World();

function MyThing() {
  // register hooks here
}

mount(world, MyThing, {});
```

Mount under a parent node:

```ts
import { useChild } from '@pulse-ts/core';

function Parent() {
  useChild(Child, { color: 'red' });
}

function Child(props: { color: string }) {
  // ...
}
```

## Hook reference

- `useWorld()`: returns the current `World`.
- `useNode()`: returns the `Node` created for this component.
- `useInit(fn)`: runs after mount; if `fn` returns a function, that function is called on destroy.
- `useDestroy(fn)`: runs when the node is destroyed/unmounted.
- `useComponent(Ctor)`: ensures and returns a component instance on the node.
- Tick hooks: `useFixedEarly`, `useFixedUpdate`, `useFixedLate`, `useFrameEarly`, `useFrameUpdate`, `useFrameLate`.
- Structure: `useChild(FC, props?)` mounts a child under the current node.
- State: `useState(key, initial)` returns `[get, set]` backed by the `State` component.
- Persistence: `useStableId(id)` assigns a stable string id on the node (used by save/load).

## Example: movement and lifetime

```ts
import {
  mount,
  useInit,
  useDestroy,
  useFixedUpdate,
  useComponent,
  Transform,
} from '@pulse-ts/core';

function Mover() {
  const t = useComponent(Transform);
  useInit(() => {
    t.localPosition.set(0, 0, 0);
    return () => console.log('cleanup when destroyed');
  });
  useFixedUpdate((dt) => {
    t.localPosition.x += 1 * dt; // 1 unit/sec
  });
}

mount(world, Mover, {});
```

## Example: simple state

```ts
import { useState } from '@pulse-ts/core';

function Counter() {
  const [getCount, setCount] = useState('count', 0);
  useFixedUpdate(() => setCount((n) => n + 1));
  useFrameUpdate(() => {
    // read latest value; no re-render model
    console.log('count:', getCount());
  });
}
```

## Example: structure and composition

```ts
function Parent() {
  useChild(Spinner);
  useChild(Mover);
}
```

