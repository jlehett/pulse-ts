---
id: TICKET-027
epic: EPIC-003
title: useTimer / useCooldown declarative timer hooks
status: done
priority: medium
created: 2026-02-26
updated: 2026-02-26
branch: ticket-027-use-timer-use-cooldown
---

## Description

Add timer utility hooks to `@pulse-ts/core` that replace manual `Math.max(0, timer - dt)` bookkeeping.

API:
- `useTimer(duration)` — returns `{ start(), reset(), cancel(), active, elapsed }`. Auto-ticks via fixed update.
- `useCooldown(duration)` — returns `{ trigger(), ready }`. After `trigger()`, `ready` is false until duration elapses.

The platformer demo manually manages 5 timers (coyote, jump hold, dash duration, dash cooldown, elapsed). Each requires 2-5 lines of tick-down logic per frame.

## Acceptance Criteria

- [x] `useTimer(duration)` auto-ticks and exposes `active`, `elapsed`, `start()`, `reset()`, `cancel()`
- [x] `useCooldown(duration)` exposes `ready` and `trigger()`
- [x] Timers tick via the fixed update loop (not frame update)
- [x] Full JSDoc with `@param`, `@returns`, `@example`
- [x] Colocated tests
- [x] Update platformer demo PlayerNode to use timer hooks

## Notes

- **2026-02-26**: Ticket created. Eliminates ~15 lines of manual timer bookkeeping in PlayerNode alone.
- **2026-02-26**: Implementation complete. Created `useTimer` and `useCooldown` in `packages/core/src/domain/fc/timers.ts` with full JSDoc, 20 colocated tests, exported via public API. PlayerNode updated — replaced 4 manual timer variables with hook calls, removing all `Math.max(0, x - dt)` bookkeeping.
