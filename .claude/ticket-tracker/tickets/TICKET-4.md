---
id: TICKET-4
title: Ergonomic physics body velocity/force API
status: open
priority: medium
epic: EPIC-2
created: 2026-02-18
---

# TICKET-4: Ergonomic physics body velocity/force API

## Problem

The current physics body API mixes paradigms: velocity is read via a getter that returns a Vec3, but written via positional-arg imperative methods (`setLinearVelocity(vx, vy, vz)`). This is awkward to use — you must destructure the getter, compute new values, then call the setter with positional args.

## Acceptance Criteria

- [ ] `setLinearVelocity` accepts either `(x, y, z)` or `({ x, y, z })` (overloaded or unified)
- [ ] Same treatment applied to `setAngularVelocity` and `applyImpulse` / `applyForce`
- [ ] Read path (`linearVelocity`, `angularVelocity`) is consistent with write path
- [ ] Breaking change is acceptable — update demo and all call sites
- [ ] Existing tests updated; new tests cover the named-param path
- [ ] JSDoc updated on all changed methods

## Before / After

**Before:**
```ts
const vy = body.linearVelocity.y;
body.setLinearVelocity(vx, vy, vz);
```

**After:**
```ts
body.setLinearVelocity({ x: vx, y: body.linearVelocity.y, z: vz });
```
