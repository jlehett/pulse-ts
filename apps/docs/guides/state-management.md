# State Management

Pulse provides two complementary hooks for sharing state: **useContext** for node-scoped state and **useStore** for world-scoped state.

## When to use which

| | `useContext` | `useStore` |
|---|---|---|
| **Scope** | Node tree — provided by a parent, consumed by descendants | World — singleton, any node can access |
| **Lifecycle** | Dies with the provider node | Dies with the world |
| **Pattern** | Dependency injection / shared config | Global shared state (setter pattern) |
| **Creation** | Explicit: `useProvideContext(ctx, value)` in a parent | Lazy: auto-created on first `useStore` call |
| **Use case** | Game state owned by an orchestrator node | Cross-cutting state shared across unrelated nodes |

## Defining a store

Use `defineStore` to declare a store with a name and factory function. The factory is called once per world on first access.

```ts
import { defineStore } from '@pulse-ts/core';

const DashCooldownStore = defineStore('dashCooldown', () => ({
    progress: [1, 1] as [number, number],
}));
```

## Reading and writing

`useStore` returns a `[state, setState]` tuple. The `state` object is a stable reference — reading a field always reflects the latest value.

```ts
import { useStore, useFixedUpdate } from '@pulse-ts/core';

// Writing from one node
function PlayerDash({ playerId }: { playerId: number }) {
    const [, setDash] = useStore(DashCooldownStore);

    useFixedUpdate(() => {
        setDash(prev => ({
            progress: prev.progress.map((p, i) =>
                i === playerId ? computeProgress() : p,
            ) as [number, number],
        }));
    });
}

// Reading from another node
function DashHud({ playerId }: { playerId: number }) {
    const [dash] = useStore(DashCooldownStore);

    useFrameUpdate(() => {
        const pct = dash.progress[playerId];
        // draw cooldown indicator...
    });
}
```

## setState

`setState` accepts either a partial object (shallow-merged) or an updater function:

```ts
const [, setScore] = useStore(ScoreStore);

// Partial object — shallow merge
setScore({ values: [10, 20] });

// Updater function — receives previous state
setScore(prev => ({ values: prev.values.map(v => v + 1) }));
```

## Automatic cleanup

Stores are destroyed when the world is destroyed. No manual reset functions are needed.

```ts
// Before: 7 manual reset calls in GameManagerNode
resetDashCooldown();
resetHitImpact();
resetPlayerVelocity();
// ...

// After: nothing. Stores die with the world.
```

## World isolation

Each world gets its own store instances. The same `StoreDefinition` used in two different worlds produces independent state.
