---
id: TICKET-113
epic: EPIC-018
title: Conditional Child Mounting (useConditionalChild)
status: done
priority: medium
branch: ticket-113-conditional-child-mounting
created: 2026-03-13
updated: 2026-03-14
labels:
  - core
  - dx
---

## Description

Implement `useConditionalChild` in `@pulse-ts/core` that evaluates a guard function each
fixed tick and mounts or destroys a child node when the guard transitions between true
and false. Same signature as `useChild` with an added guard parameter.

Design doc: `design-docs/approved/044-conditional-child-mounting.md`

## Acceptance Criteria

- [x] `useConditionalChild(guard, fc, props)` mounts child when guard becomes true
- [x] Child is destroyed when guard becomes false
- [x] Guard is evaluated each fixed tick
- [x] Child is cleaned up when parent node is destroyed
- [x] Props are passed to the FC on mount
- [x] JSDoc with examples
- [x] Unit tests for mount/unmount transitions, cleanup
- [x] Documentation updated

## Notes

- **2026-03-13**: Ticket created from approved design doc #44.
- **2026-03-14**: Starting implementation.
- **2026-03-14**: Implementation complete. 7 new tests covering mount/unmount transitions, re-mounting, parent cleanup, props passing, guard evaluation, and idempotency. Exported from public FC API.
