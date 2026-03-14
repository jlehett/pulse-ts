# Approved: Conditional Child Mounting (`useConditionalChild`)

> Reactively mount and unmount child nodes based on runtime state.

**Origin:** Engine Improvements #44 (`useConditionalChild`).

---

## Summary

A `useConditionalChild` hook in `@pulse-ts/core` that evaluates a guard function each fixed tick and mounts or destroys a child node when the guard transitions between `true` and `false`.

---

## Problem

`useChild()` always creates a child node — there's no built-in way to dynamically mount/unmount children based on changing game state. Static conditions (evaluated once at mount time) work with `if` guards around `useChild`, but dynamic spawning (enemy waves, conditional HUD elements, feature toggles) requires manually tracking node references and calling `world.mount()` / `node.destroy()` in a `useFixedUpdate` block. This is ~8 lines of boilerplate per conditional child.

---

## API

```typescript
/**
 * Conditionally mount/unmount a child node based on a reactive guard.
 * The guard is evaluated each fixed tick. When it transitions:
 *   false → true: child is mounted as a child of the current node
 *   true → false: child is destroyed
 *
 * @param guard - Evaluated each tick to determine mount state.
 * @param fc - The function component to mount.
 * @param props - Props passed to the FC.
 *
 * @example
 * // Mount overlay only when online
 * useConditionalChild(
 *     () => online,
 *     DisconnectOverlayNode,
 *     { isHost: props.isHost },
 * );
 *
 * @example
 * // Dynamic enemy spawning — reactive to game state
 * useConditionalChild(
 *     () => gameState.phase === 'playing' && waveActive,
 *     EnemyNode,
 *     { difficulty: currentWave },
 * );
 */
function useConditionalChild<P>(
    guard: () => boolean,
    fc: FC<P>,
    props?: P,
): void;
```

---

## Usage Examples

### Before — manual mount/unmount tracking

```typescript
let enemyNode: Node | null = null;

useFixedUpdate(() => {
    if (shouldSpawnEnemy && !enemyNode) {
        enemyNode = world.mount(EnemyNode, props, { parent: node });
    } else if (!shouldSpawnEnemy && enemyNode) {
        enemyNode.destroy();
        enemyNode = null;
    }
});
```

### After — declarative

```typescript
useConditionalChild(
    () => shouldSpawnEnemy,
    EnemyNode,
    props,
);
```

---

## Design Decisions

- **Guard evaluated each fixed tick** — Consistent with `useWatch` and `when` guards. Fixed tick avoids redundant evaluations at high frame rates.
- **Automatic cleanup** — Child is destroyed when guard becomes false or when the parent node is destroyed. No manual tracking needed.
- **Same signature as `useChild`** — `fc` and `props` parameters match `useChild` for familiarity. The only addition is the `guard` parameter.
- **No return value** — The hook manages the child's lifecycle entirely. If users need a reference to the child node for imperative control, they should use `useChild` + manual lifecycle management.
