---
paths:
  - "demos/arena/src/replay.ts"
  - "demos/arena/src/nodes/LocalPlayerNode.ts"
  - "demos/arena/src/nodes/GameManagerNode.ts"
---
# Replay Mark Hit Timing Constraint

## Critical Timing Requirement

`markHit()` must be called **BEFORE** `commitFrame()` within the same fixed step. The function records `lastHitWriteCount = writeCount`, which points to the **NEXT frame index to be written** (not the most recently written frame).

## How It Works in Real Gameplay

1. **`useFixedUpdate`** — Physics + collision detection runs
   - Collision handler in `LocalPlayerNode` calls `markHit()` during collision
   - At this moment, `writeCount = N` (next frame index to write)
   - `lastHitWriteCount` is set to `N`

2. **`useFixedLate`** — Frame commit happens in `GameManagerNode`
   - `commitFrame()` writes the frame at index `N`
   - `writeCount` increments to `N+1`

This ordering ensures the hit index correctly maps into the playback buffer.

## Test Implication

In `startReplay()`, the condition `lastHitWriteCount < writeCount` is strict (not `<=`):
- If `markHit()` is called AFTER the last `commitFrame()` with no subsequent frame recorded, the hit won't be detected as a real hit.
- **Tests must record at least one more frame after `markHit()` before calling `startReplay()`.**

## Related

- `demos/arena/src/nodes/LocalPlayerNode.ts` — collision handler calls `markHit()`
- `demos/arena/src/nodes/GameManagerNode.ts` — `commitFrame()` runs in `useFixedLate`
