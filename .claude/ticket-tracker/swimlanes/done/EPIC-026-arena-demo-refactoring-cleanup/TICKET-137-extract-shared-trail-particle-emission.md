---
id: TICKET-137
title: Extract shared trail particle emission logic
status: done
epic: EPIC-026
created: 2026-03-14
updated: 2026-03-14
priority: medium
branch: ticket-137-extract-shared-trail-particle-emission
---

## Problem

The velocity-proportional trail emission pattern is copy-pasted in three locations:
- `LocalPlayerNode.ts:786-809` (uses `body.linearVelocity`)
- `RemotePlayerNode.ts:174-201` (derives velocity from position deltas)
- `ReplayNode.ts:309-327` (uses replay velocity)

All three share the same accumulator, interval calculation (`TRAIL_BASE_INTERVAL / (vmag / TRAIL_VELOCITY_REFERENCE)`), `vmag > 0.1` guard, and reset-on-idle logic.

## Solution

Extract a `TrailEmitter` utility class or `useTrailEmitter(burst, getVelocity, getPosition)` hook that encapsulates the accumulation/interval/guard logic. Each node would just provide its velocity and position sources.

## Files

- `demos/arena/src/nodes/LocalPlayerNode.ts`
- `demos/arena/src/nodes/RemotePlayerNode.ts`
- `demos/arena/src/nodes/ReplayNode.ts`
