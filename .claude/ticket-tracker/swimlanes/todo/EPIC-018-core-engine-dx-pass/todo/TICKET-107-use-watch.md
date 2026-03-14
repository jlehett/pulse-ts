---
id: TICKET-107
epic: EPIC-018
title: useWatch Hook
status: todo
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

- [ ] `useWatch(selector, callback)` detects value changes via strict equality
- [ ] Callback receives `(newValue, previousValue)`
- [ ] Skips initial value (only fires on changes)
- [ ] Defaults to fixed tick evaluation
- [ ] Optional `kind` parameter for frame tick evaluation
- [ ] JSDoc with examples on all public APIs
- [ ] Unit tests for change detection, skip-initial, tick kinds
- [ ] Documentation updated

## Notes

- **2026-03-13**: Ticket created from approved design doc #5.
