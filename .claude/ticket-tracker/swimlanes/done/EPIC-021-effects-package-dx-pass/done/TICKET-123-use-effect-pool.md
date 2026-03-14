---
id: TICKET-123
epic: EPIC-021
title: useEffectPool Hook
status: done
priority: medium
created: 2026-03-13
updated: 2026-03-14
labels:
  - effects
  - dx
---

## Description

Implement `useEffectPool` in `@pulse-ts/effects` as a fixed-size slot pool with trigger,
oldest-slot recycling, and auto-deactivation. Each slot exposes `progress` (0 to 1) for
driving visual effects. Used for shockwaves, hit impacts, explosions, etc.

Design doc: `design-docs/approved/016-use-effect-pool.md`

## Acceptance Criteria

- [x] `useEffectPool(size, duration)` creates a fixed-size pool
- [x] `pool.trigger(data)` activates the oldest inactive slot (or recycles oldest active)
- [x] Each slot has `active`, `progress` (0→1), and user data
- [x] Slots auto-deactivate when progress reaches 1
- [x] `pool.active()` iterates currently active slots
- [x] JSDoc with examples
- [x] Unit tests for triggering, recycling, progress, auto-deactivation
- [x] Documentation updated

## Notes

- **2026-03-13**: Ticket created from approved design doc #16.
