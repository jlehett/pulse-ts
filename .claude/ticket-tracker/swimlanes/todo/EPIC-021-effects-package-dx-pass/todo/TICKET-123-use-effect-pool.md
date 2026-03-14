---
id: TICKET-123
epic: EPIC-021
title: useEffectPool Hook
status: todo
priority: medium
created: 2026-03-13
updated: 2026-03-13
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

- [ ] `useEffectPool(size, duration)` creates a fixed-size pool
- [ ] `pool.trigger(data)` activates the oldest inactive slot (or recycles oldest active)
- [ ] Each slot has `active`, `progress` (0→1), and user data
- [ ] Slots auto-deactivate when progress reaches 1
- [ ] `pool.active()` iterates currently active slots
- [ ] JSDoc with examples
- [ ] Unit tests for triggering, recycling, progress, auto-deactivation
- [ ] Documentation updated

## Notes

- **2026-03-13**: Ticket created from approved design doc #16.
