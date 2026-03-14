---
id: TICKET-115
epic: EPIC-019
title: useScreenProjection Hook
status: done
priority: medium
branch: ticket-115-use-screen-projection
created: 2026-03-13
updated: 2026-03-14
labels:
  - three
  - dx
---

## Description

Implement `useScreenProjection` in `@pulse-ts/three` that returns a projection function
for converting world-space positions to screen-space coordinates. Reuses internal Vector3
for zero-allocation per-frame usage.

Design doc: `design-docs/approved/007-use-screen-projection.md`

## Acceptance Criteria

- [x] `useScreenProjection()` returns a `project(position)` function
- [x] Returns `{ x, y, depth, visible }` in screen pixels
- [x] Reuses internal Vector3 (no allocations per call)
- [x] Works with current camera and renderer dimensions
- [x] JSDoc with examples
- [x] Unit tests
- [x] Documentation updated

## Notes

- **2026-03-13**: Ticket created from approved design doc #7.
- **2026-03-14**: Starting implementation.
- **2026-03-14**: Implementation complete. Hook, tests (11 passing), JSDoc, and docs added.
