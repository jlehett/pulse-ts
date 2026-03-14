---
id: TICKET-111
epic: EPIC-018
title: Update Hook 'when' Guard
status: done
priority: medium
branch: ticket-111-update-hook-when-guard
created: 2026-03-13
updated: 2026-03-14
labels:
  - core
  - dx
---

## Description

Add a `when` option to existing `useFixedUpdate` and `useFrameUpdate` hooks. When
provided, the callback only runs if the guard function returns true. Eliminates the
ubiquitous `if (gameState.phase === 'playing') { ... }` pattern inside update callbacks.

Design doc: `design-docs/approved/022-update-hook-when-guard.md`

## Acceptance Criteria

- [x] `useFixedUpdate(cb, { when: () => boolean })` — callback skipped when guard is false
- [x] `useFrameUpdate(cb, { when: () => boolean })` — same behavior
- [x] Guard is evaluated each tick before the callback
- [x] Backward compatible — `when` is optional, existing usages unchanged
- [x] JSDoc with examples
- [x] Unit tests for guard behavior
- [x] Documentation updated

## Notes

- **2026-03-13**: Ticket created from approved design doc #22.
- **2026-03-14**: Implementation complete. Added `when` to all 6 update hook variants via shared `reg` function. 4 new tests.
