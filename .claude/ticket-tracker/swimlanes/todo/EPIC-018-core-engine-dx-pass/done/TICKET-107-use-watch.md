---
id: TICKET-107
epic: EPIC-018
title: useWatch Hook
status: done
priority: high
branch: ticket-107-use-watch
created: 2026-03-13
updated: 2026-03-13
labels:
  - core
  - dx
---

## Description

Implement `useWatch` in `@pulse-ts/core` for value-change detection. Accepts a `selector`
function and a `callback`, uses strict equality, skips the initial value, and defaults to
fixed tick evaluation.

Design doc: `design-docs/approved/005-use-watch.md`

## Acceptance Criteria

- [x] `useWatch(selector, callback)` detects value changes via strict equality
- [x] Callback receives `(newValue, previousValue)`
- [x] Skips initial value (only fires on changes)
- [x] Defaults to fixed tick evaluation
- [x] Optional `kind` parameter for frame tick evaluation
- [x] JSDoc with examples on all public APIs
- [x] Unit tests for change detection, skip-initial, tick kinds
- [x] Documentation updated

## Notes

- **2026-03-13**: Ticket created from approved design doc #5.
- **2026-03-13**: Implementation complete. Added `watch.ts` with `useWatch`, 8 passing tests, docs updated.
