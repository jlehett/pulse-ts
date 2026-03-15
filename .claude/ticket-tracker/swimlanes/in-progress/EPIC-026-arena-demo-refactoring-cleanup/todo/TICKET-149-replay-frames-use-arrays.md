---
id: TICKET-149
title: Use arrays instead of named fields in replay frames
status: todo
epic: EPIC-026
created: 2026-03-14
priority: low
---

## Problem

Replay frames store positions as 6 named fields (`p0x, p0y, p0z, p1x, p1y, p1z`) and staging uses 6 more (`staged0x...staged1z`). Functions like `getReplayPosition` and `getReplayVelocity` branch on `playerId === 0` to select the right field set, resulting in duplicated interpolation code.

## Solution

Use `positions: [number, number, number][]` (or a flat `Float32Array`) indexed by player ID. This eliminates the `playerId === 0` branching in `getReplayPosition`, `getReplayVelocity`, `stagePlayerPosition`, `recordFrame`, and `commitFrame`. The staging fields similarly become an array.

## Files

- `demos/arena/src/replay.ts`
