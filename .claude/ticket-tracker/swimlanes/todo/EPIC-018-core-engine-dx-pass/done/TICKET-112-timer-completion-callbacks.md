---
id: TICKET-112
epic: EPIC-018
title: Timer Completion Callbacks
status: done
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

- [x] `useTimer(duration, { onComplete })` — callback fires once when timer expires
- [x] `useTimer(duration, { onTick })` — callback fires each tick with `(remaining, elapsed)`
- [x] `useCooldown(duration, { onReady })` — callback fires once when cooldown becomes ready
- [x] `useCooldown(duration, { onProgress })` — callback fires each tick with `(remaining, duration)`
- [x] `onComplete` fires exactly once per `reset()` cycle
- [x] Backward compatible — all callbacks are optional
- [x] JSDoc with examples
- [x] Unit tests for all callbacks and edge cases
- [x] Documentation updated

## Notes

- **2026-03-13**: Ticket created from approved design doc #34.
- **2026-03-14**: Starting implementation.
- **2026-03-14**: Implementation complete. Added TimerOptions/CooldownOptions interfaces, 15 new tests (33 total), JSDoc with examples, exported new types. No existing docs to update (timers not yet documented in apps/docs/).
