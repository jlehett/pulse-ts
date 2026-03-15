---
id: TICKET-142
title: Move camera shake state to world-scoped store
status: in-progress
epic: EPIC-026
created: 2026-03-14
priority: medium
---

## Problem

Camera shake uses module-level mutable variables (`shakeIntensity`, `shakeDuration`, `shakeElapsed`) plus exported functions (`triggerCameraShake`, `resetCameraShake`) in `CameraRigNode.ts:72-104`. This creates hidden coupling:
- `LocalPlayerNode` imports `triggerCameraShake`
- `ReplayNode` imports `triggerCameraShake`
- `GameManagerNode` imports `resetCameraShake`

Module-level state persists across world instances and requires manual reset.

## Solution

Move shake state into a world-scoped store (following the `ShockwaveStore` / `DashCooldownStore` pattern). This:
- Ties state lifecycle to the world (auto-reset on `world.destroy()`)
- Eliminates the manual `resetCameraShake()` call in `GameManagerNode`
- Makes the dependency explicit via store imports

## Files

- `demos/arena/src/nodes/CameraRigNode.ts`
- `demos/arena/src/nodes/LocalPlayerNode.ts`
- `demos/arena/src/nodes/ReplayNode.ts`
- `demos/arena/src/nodes/GameManagerNode.ts`
