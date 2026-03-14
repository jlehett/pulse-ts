# Approved: Collision Filter Option

> Filter collision callbacks by component type or custom predicate — skip irrelevant collision events declaratively.

**Origin:** Engine Improvements #40 (Collision Filter).

---

## Summary

Add an optional `filter` parameter to `useOnCollisionStart`, `useOnCollisionEnd`, and `useOnCollision` in `@pulse-ts/physics`. Accepts either a component constructor (shorthand for "other node has this component") or a predicate function for complex filtering logic.

---

## Problem

Every collision callback in the arena demo has a manual guard:

```typescript
useOnCollisionStart(({ other }) => {
    if (!getComponent(other, PlayerTag)) return;
    // actual logic...
});
```

This pattern repeats in 6+ callbacks across 4 files. The guard is boilerplate that obscures the actual collision response logic and is easy to forget.

---

## API

```typescript
type CollisionFilter =
    | ComponentType
    | ((other: Node) => boolean);

/**
 * @example
 * // Simple — only collide with nodes that have PlayerTag
 * useOnCollisionStart(({ other }) => {
 *     applyKnockback(other);
 * }, { filter: PlayerTag });
 *
 * @example
 * // Complex — collide with players that don't have a shield
 * useOnCollisionStart(({ other }) => {
 *     applyDamage(other);
 * }, { filter: (other) => !!getComponent(other, PlayerTag) && !getComponent(other, Shield) });
 */
function useOnCollisionStart(
    fn: (e: { self: Node; other: Node }) => void,
    options?: { filter?: CollisionFilter },
): void;

// Same options for useOnCollisionEnd and useOnCollision
function useOnCollisionEnd(
    fn: (e: { self: Node; other: Node }) => void,
    options?: { filter?: CollisionFilter },
): void;

function useOnCollision(
    fn: (e: { self: Node; other: Node }) => void,
    options?: { filter?: CollisionFilter },
): void;
```

---

## Usage Examples

### Before — manual guard

```typescript
useOnCollisionStart(({ self, other }) => {
    if (!getComponent(other, PlayerTag)) return;
    const body = getComponent(other, RigidBody)!;
    applyKnockback(body, self.position);
});
```

### After — component shorthand

```typescript
useOnCollisionStart(({ self, other }) => {
    const body = getComponent(other, RigidBody)!;
    applyKnockback(body, self.position);
}, { filter: PlayerTag });
```

### Custom predicate

```typescript
useOnCollisionStart(({ other }) => {
    applyDamage(other);
}, { filter: (other) => !!getComponent(other, PlayerTag) && !getComponent(other, Shield) });
```

---

## Performance

No concern. The predicate runs as a post-filter on collision *events*, not during broad-phase or narrow-phase detection. The physics engine has already done the expensive work (spatial grid queries, contact detection, solver iterations). By the time the filter runs, there are typically 1–5 collision events per frame. A predicate doing two `WeakMap` lookups is nanoseconds compared to the milliseconds the engine spent detecting the collision.

The component shorthand (`filter: PlayerTag`) is just syntactic sugar — internally it performs the same `getComponent` lookup a predicate would.

---

## Design Decisions

- **Component shorthand covers 90% of cases** — Most collision filters just check "does the other node have component X?" The shorthand makes this a one-word addition.
- **Predicate escape hatch** — For complex filters (multiple components, negation, property checks), a function provides full flexibility without needing a custom query DSL.
- **`ComponentType`, not instances** — The shorthand accepts a component constructor (`PlayerTag`), not an instance. Consistent with `getComponent` and `hasComponent` patterns.
- **Options object, not positional parameter** — `{ filter }` leaves room for future options without breaking the signature.
- **Applied to all three hooks** — `useOnCollisionStart`, `useOnCollisionEnd`, and `useOnCollision` all accept the same filter option for consistency.
