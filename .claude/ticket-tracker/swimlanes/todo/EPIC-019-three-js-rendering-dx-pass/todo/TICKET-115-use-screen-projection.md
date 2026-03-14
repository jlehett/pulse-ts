---
id: TICKET-115
epic: EPIC-019
title: useScreenProjection Hook
status: todo
priority: medium
created: 2026-03-13
updated: 2026-03-13
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

- [ ] `useScreenProjection()` returns a `project(position)` function
- [ ] Returns `{ x, y, depth, visible }` in screen pixels
- [ ] Reuses internal Vector3 (no allocations per call)
- [ ] Works with current camera and renderer dimensions
- [ ] JSDoc with examples
- [ ] Unit tests
- [ ] Documentation updated

## Notes

- **2026-03-13**: Ticket created from approved design doc #7.
