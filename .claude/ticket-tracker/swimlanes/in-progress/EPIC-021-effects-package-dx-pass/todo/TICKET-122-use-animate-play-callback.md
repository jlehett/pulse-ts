---
id: TICKET-122
epic: EPIC-021
title: useAnimate Play Callback
status: todo
priority: low
created: 2026-03-13
updated: 2026-03-13
labels:
  - effects
  - dx
---

## Description

Enhance `useAnimate`'s `play()` method in `@pulse-ts/effects` to accept an optional
callback `play(onUpdate?: (value: number) => void)` for fire-and-forget animation
consumption. Works across all animation modes (tween, oscillation, rate).

Design doc: `design-docs/approved/013-use-animate-play-callback.md`

## Acceptance Criteria

- [ ] `play(onUpdate)` accepts optional callback receiving current value each frame
- [ ] Callback is called each frame while animation is playing
- [ ] Works with tween, oscillation, and rate modes
- [ ] Backward compatible — `play()` with no args still works
- [ ] JSDoc with examples
- [ ] Unit tests for callback invocation across modes
- [ ] Documentation updated

## Notes

- **2026-03-13**: Ticket created from approved design doc #13.
