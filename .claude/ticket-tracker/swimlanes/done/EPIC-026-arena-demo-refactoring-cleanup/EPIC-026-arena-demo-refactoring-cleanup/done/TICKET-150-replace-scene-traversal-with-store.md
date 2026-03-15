---
id: TICKET-150
title: Replace scene traversal with store reads for player positions
status: done
epic: EPIC-026
created: 2026-03-14
priority: low
---

## Problem

`PlatformNode.ts:760-768` and `AtmosphericDustNode.ts` find player positions by traversing the entire Three.js scene graph every frame:

```ts
scene.traverse((child) => {
    if (child.type === 'Group' && child.parent !== scene) {
        // filter by XZ distance...
    }
});
```

This is fragile (relies on scene graph structure conventions) and wasteful when the exact same positions are already available in `ai/playerPositions.ts` via `getPlayerPosition()`.

## Solution

Replace the scene traversal with direct `getPlayerPosition()` calls. This is simpler, faster, and doesn't depend on Three.js scene graph internals.

## Note

If TICKET-143 (move player positions to world-scoped store) is completed first, use the store-based API instead.

## Files

- `demos/arena/src/nodes/PlatformNode.ts`
- `demos/arena/src/nodes/AtmosphericDustNode.ts`
