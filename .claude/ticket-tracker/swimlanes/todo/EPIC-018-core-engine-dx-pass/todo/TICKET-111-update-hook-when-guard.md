---
id: TICKET-111
epic: EPIC-018
title: Update Hook 'when' Guard
status: todo
priority: medium
branch: ticket-111-update-hook-when-guard
created: 2026-03-13
updated: 2026-03-13
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

- [ ] `useFixedUpdate(cb, { when: () => boolean })` — callback skipped when guard is false
- [ ] `useFrameUpdate(cb, { when: () => boolean })` — same behavior
- [ ] Guard is evaluated each tick before the callback
- [ ] Backward compatible — `when` is optional, existing usages unchanged
- [ ] JSDoc with examples
- [ ] Unit tests for guard behavior
- [ ] Documentation updated

## Notes

- **2026-03-13**: Ticket created from approved design doc #22.
