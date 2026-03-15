---
id: TICKET-148
title: Create generic shared effect pool factory
status: in-progress
epic: EPIC-026
created: 2026-03-14
updated: 2026-03-14
priority: low
branch: ticket-148-generic-shared-effect-pool-factory
---

## Problem

`shockwave.ts` and `hitImpact.ts` follow an identical structural pattern:
1. Define a data interface (`ShockwaveData`, `HitImpactData`)
2. Define a store holding `pool: EffectPoolHandle<T> | null`
3. Define a `useXxxPool()` hook that lazily creates the pool via `useEffectPool` and stores it

The boilerplate (store definition, lazy init check, `setStore`) is duplicated.

## Solution

Create a generic `createSharedPool<T>(name, config)` factory that returns both the store definition and the hook. Each effect pool file reduces to a few lines of configuration:

```ts
export const { Store: ShockwaveStore, usePool: useShockwavePool } =
    createSharedPool<ShockwaveData>('shockwave', {
        size: 4, duration: 0.35, create: () => ({ centerX: 0, centerY: 0 }),
    });
```

## Files

- `demos/arena/src/shockwave.ts`
- `demos/arena/src/hitImpact.ts`

## Notes

- **2026-03-14**: Starting implementation
