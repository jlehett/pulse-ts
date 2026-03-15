---
id: TICKET-138
title: Extract shared collision VFX trigger
status: todo
epic: EPIC-026
created: 2026-03-14
priority: medium
---

## Problem

Both the live collision handler (`LocalPlayerNode.ts:435-463`, `applyKnockbackEffects`) and the replay hit handler (`ReplayNode.ts:287-306`) perform the same VFX sequence:
1. Spawn white particle burst at impact point
2. Trigger camera shake
3. Compute screen-space UV from world position
4. Trigger shockwave pool
5. Trigger hit impact pool
6. Play impact sound

The replay version uses the midpoint of both players; the live version uses the surface point. But the pattern is identical.

## Solution

Extract a `triggerCollisionEffects(worldPos, camera, pools)` helper that encapsulates the VFX + audio burst. Both call sites pass the relevant position and pool handles.

## Files

- `demos/arena/src/nodes/LocalPlayerNode.ts`
- `demos/arena/src/nodes/ReplayNode.ts`
