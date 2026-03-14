# Guide: Collision Filters

Filter collision callbacks by component type or custom predicate to skip irrelevant collision events declaratively.

## The problem

Without filters, every collision callback needs a manual guard:

```ts
import { getComponent } from '@pulse-ts/core';
import { useOnCollisionStart } from '@pulse-ts/physics';

useOnCollisionStart(({ other }) => {
    if (!getComponent(other, PlayerTag)) return;
    // actual logic...
    applyKnockback(other);
});
```

This pattern repeats across callbacks and obscures the actual collision response logic.

## Component shorthand

Pass a component constructor to `filter` -- the callback only fires when the other node has that component:

```ts
import { useOnCollisionStart } from '@pulse-ts/physics';

useOnCollisionStart(({ other }) => {
    applyKnockback(other);
}, { filter: PlayerTag });
```

Internally this performs a `getComponent(other, PlayerTag)` check. If the other node does not have the component, the callback is skipped entirely.

## Predicate filter

For complex filtering (multiple components, negation, property checks), pass a function:

```ts
import { getComponent } from '@pulse-ts/core';
import { useOnCollisionStart } from '@pulse-ts/physics';

useOnCollisionStart(({ other }) => {
    applyDamage(other);
}, {
    filter: (other) =>
        !!getComponent(other, PlayerTag) &&
        !getComponent(other, Shield)
});
```

The predicate receives the `other` node and returns `true` to allow the callback or `false` to skip it.

## Works with all collision hooks

The `filter` option is available on all three collision hooks:

```ts
import { useOnCollisionStart, useOnCollisionEnd, useOnCollision } from '@pulse-ts/physics';

// Fire once when collision starts with a player
useOnCollisionStart(({ other }) => {
    highlight(other);
}, { filter: PlayerTag });

// Fire once when collision ends with a player
useOnCollisionEnd(({ other }) => {
    removeHighlight(other);
}, { filter: PlayerTag });

// Fire every frame while in contact with an enemy
useOnCollision(({ other }) => {
    drainHealth(other);
}, { filter: EnemyTag });
```

## Backward compatible

The `filter` option is entirely optional. Existing code without filters continues to work unchanged:

```ts
// Still works -- fires for every collision
useOnCollisionStart(({ self, other }) => {
    console.log('collided with', other.id);
});
```

## Types

```ts
import type { CollisionFilter, CollisionOptions } from '@pulse-ts/physics';

// CollisionFilter = ComponentCtor | ((other: Node) => boolean)
// CollisionOptions = { filter?: CollisionFilter }
```
