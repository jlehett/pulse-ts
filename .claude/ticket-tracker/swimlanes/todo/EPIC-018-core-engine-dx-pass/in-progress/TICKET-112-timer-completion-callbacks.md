---
id: TICKET-112
epic: EPIC-018
title: Timer Completion Callbacks
status: in-progress
priority: medium
branch: ticket-112-timer-completion-callbacks
created: 2026-03-13
updated: 2026-03-14
labels:
  - core
  - dx
---

## Description

Add optional callback parameters to existing `useTimer` and `useCooldown` hooks.
`useTimer` gets `onComplete` (fires once on expiry) and `onTick` (fires each tick while
active). `useCooldown` gets `onReady` (fires once when ready) and `onProgress` (fires each
tick with remaining/duration).

Design doc: `design-docs/approved/034-timer-completion-callbacks.md`

## Acceptance Criteria

- [ ] `useTimer(duration, { onComplete })` — callback fires once when timer expires
- [ ] `useTimer(duration, { onTick })` — callback fires each tick with `(remaining, elapsed)`
- [ ] `useCooldown(duration, { onReady })` — callback fires once when cooldown becomes ready
- [ ] `useCooldown(duration, { onProgress })` — callback fires each tick with `(remaining, duration)`
- [ ] `onComplete` fires exactly once per `reset()` cycle
- [ ] Backward compatible — all callbacks are optional
- [ ] JSDoc with examples
- [ ] Unit tests for all callbacks and edge cases
- [ ] Documentation updated

## Notes

- **2026-03-13**: Ticket created from approved design doc #34.
- **2026-03-14**: Starting implementation.
