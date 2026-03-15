---
id: TICKET-143
title: Move player positions to world-scoped store
status: done
epic: EPIC-026
created: 2026-03-14
priority: medium
---

## Problem

`ai/playerPositions.ts` uses module-level arrays with `setPlayerPosition`, `getPlayerPosition`, `resetPlayerPositions`. Consumed by:
- `LocalPlayerNode` (writes positions)
- `AiPlayerNode` (reads positions)
- `GameManagerNode` (calls `resetPlayerPositions`)

Module-level state persists across world instances and requires manual reset.

## Solution

Move to a world-scoped store. Could either:
- Merge into `PlayerVelocityStore` (which already tracks per-player state)
- Create a new `PlayerPositionStore`

This eliminates module-level state and the manual `resetPlayerPositions()` call.

## Files

- `demos/arena/src/ai/playerPositions.ts`
- `demos/arena/src/nodes/LocalPlayerNode.ts`
- `demos/arena/src/nodes/AiPlayerNode.ts`
- `demos/arena/src/nodes/GameManagerNode.ts`
