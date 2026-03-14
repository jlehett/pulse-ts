# Approved: Scoped State Stores (`defineStore` / `useStore`)

> World-scoped shared state with setter pattern, automatic lifecycle management, and lazy creation.

**Origin:** Engine Improvements #4 (`useStore`), refined through design discussion.

---

## Summary

A new `defineStore` / `useStore` API in `@pulse-ts/core` that provides:

1. **World-scoped shared state** — singleton per world, accessible from any node.
2. **Setter pattern** — immutable updates via setter function (like React's `useState`).
3. **Lazy creation** — store instance is created on first `useStore` call within a world.
4. **Automatic cleanup** — store is destroyed when the world is destroyed. No manual reset functions.

---

## Problem

The arena demo has 5+ module-scoped singleton state stores (`dashCooldown.ts`, `hitImpact.ts`, `playerVelocity.ts`, `shockwave.ts`, `replay.ts`) that manage mutable state via module-level variables. These persist across world destroys, requiring 7 manual `reset*()` calls in `GameManagerNode`. Forgetting a reset causes stale-state bugs that only appear on the second game session.

---

## Relationship to `useContext`

These are complementary APIs for different scopes:

| | `useContext` (existing) | `useStore` (new) |
|---|---|---|
| **Scope** | Node — provided by a parent, consumed by descendants | World — singleton, any node can access |
| **Lifecycle** | Dies with the provider node | Dies with the world |
| **Pattern** | Dependency injection / shared config (mutable by reference) | Global shared state (setter pattern) |
| **Creation** | Explicit: `useProvideContext(ctx, value)` in a parent | Lazy: auto-created on first `useStore` call |
| **Use case** | Game state owned by an orchestrator node | Cross-cutting state shared across unrelated nodes |

`useContext` is already fully implemented and handles node-scoped state well. `useStore` fills the gap for world-scoped state that doesn't belong to any particular node.

---

## API

### `defineStore`

```typescript
/**
 * Define a named store with a factory function that creates the initial state.
 * The factory is called once per world on first access. The state is
 * destroyed when the world is destroyed.
 *
 * @param name - Debug name for the store.
 * @param factory - Called to create the initial state for each world.
 * @returns A store definition usable with `useStore`.
 *
 * @example
 * const DashCooldownStore = defineStore('dashCooldown', () => ({
 *     progress: [1, 1] as [number, number],
 * }));
 */
function defineStore<T>(name: string, factory: () => T): StoreDefinition<T>;
```

### `useStore`

```typescript
/**
 * Access a world-scoped store. Creates the store on first access within
 * the current world. Returns the same instance for all callers in the
 * same world. Returns a [state, setState] tuple with setter pattern.
 *
 * @param definition - The store definition created by `defineStore`.
 * @returns A tuple of [currentState, setState].
 *
 * @example
 * const [dash, setDash] = useStore(DashCooldownStore);
 *
 * // Read
 * const progress = dash.progress[playerId];
 *
 * // Update with partial state (shallow merge)
 * setDash({ progress: [0.5, 1] });
 *
 * // Update with updater function
 * setDash(prev => ({
 *     progress: prev.progress.map((p, i) => i === playerId ? 0.5 : p) as [number, number],
 * }));
 */
function useStore<T>(definition: StoreDefinition<T>): [T, SetStore<T>];

type SetStore<T> = (update: Partial<T> | ((prev: T) => Partial<T>)) => void;
```

---

## Usage Examples

### Defining a store

```typescript
// stores/dashCooldown.ts
import { defineStore } from '@pulse-ts/core';

export const DashCooldownStore = defineStore('dashCooldown', () => ({
    progress: [1, 1] as [number, number],
}));
```

### Writing from one node

```typescript
// LocalPlayerNode.ts
import { useStore } from '@pulse-ts/core';
import { DashCooldownStore } from '../stores/dashCooldown';

function LocalPlayerNode({ playerId }: Props) {
    const [, setDash] = useStore(DashCooldownStore);

    useFrameUpdate(() => {
        setDash(prev => ({
            progress: prev.progress.map((p, i) =>
                i === playerId ? (dashCD.ready ? 1 : 1 - dashCD.remaining / DASH_COOLDOWN) : p,
            ) as [number, number],
        }));
    });
}
```

### Reading from another node

```typescript
// DashCooldownHudNode.ts
function DashCooldownHudNode({ playerId }: Props) {
    const [dash] = useStore(DashCooldownStore);

    useFrameUpdate(() => {
        const pct = dash.progress[playerId];
        // draw cooldown indicator...
    });
}
```

### No manual resets needed

```typescript
// GameManagerNode.ts — before: 7 manual reset calls
// GameManagerNode.ts — after: nothing. Stores die with the world.
export function GameManagerNode() {
    const gameState = useContext(GameCtx);
    // Just game logic — no cleanup boilerplate
}
```

---

## Lifecycle

1. **Creation:** First `useStore(MyStore)` call within a world invokes the factory, caches the instance on the world.
2. **Access:** Subsequent `useStore(MyStore)` calls in the same world return the same cached instance.
3. **Destruction:** When `world.destroy()` is called, all store instances are discarded. The next world gets fresh instances from the factory.

---

## Subsumes

- **#27 (`useModuleReset`)** — Module reset registries are unnecessary when state is world-scoped.
- **#48 (world lifecycle events)** — The primary motivation for world lifecycle events was resetting module state, which is now automatic.
