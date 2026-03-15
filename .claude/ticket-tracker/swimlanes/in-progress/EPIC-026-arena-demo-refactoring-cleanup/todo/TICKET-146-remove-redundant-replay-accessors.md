---
id: TICKET-146
title: Remove redundant replay accessor functions
status: todo
epic: EPIC-026
created: 2026-03-14
priority: low
---

## Problem

`replay.ts:350-476` has 7 one-liner property accessor functions that add no value over direct property access:
- `isReplayActive(s) => s.active`
- `getReplayScorer(s) => s.scorer`
- `getReplayKnockedOut(s) => s.knockedOut`
- `hasReplayHit(s) => s.hadRealHit`
- `getReplayHitIndices(s) => s.hitIndices`
- `getReplayCursorPos(s) => s.cursorPos`

`ReplayState` is already exported, so consumers can read these properties directly.

## Solution

Remove the trivial accessor functions and update consumers to read the properties directly. Keep only functions that compute something: `getReplayPosition`, `getReplayVelocity`, `getReplaySpeed`, `getReplayHitProximity`, `getReplayPastHit`.

## Files

- `demos/arena/src/replay.ts`
- All consumers of the removed functions (CameraRigNode, ReplayNode, GameManagerNode)
