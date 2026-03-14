---
id: TICKET-116
epic: EPIC-019
title: useInterpolatedPosition Hook
status: todo
priority: medium
branch: ticket-116-use-interpolated-position
created: 2026-03-13
updated: 2026-03-14
labels:
  - three
  - dx
---

## Description

Implement `useInterpolatedPosition` in `@pulse-ts/three` as a one-liner for fixed-step
to frame-rate position interpolation. Stores previous/current fixed-step positions and
interpolates in `useFrameUpdate` using the world's interpolation alpha. Includes a `snap`
callback for teleportation.

Design doc: `design-docs/approved/025-use-interpolated-position.md`

## Acceptance Criteria

- [ ] `useInterpolatedPosition(root, source)` interpolates position each frame
- [ ] Stores previous and current fixed-step positions
- [ ] Uses world interpolation alpha for smooth rendering
- [ ] `snap` callback resets both positions to avoid lerp artifacts
- [ ] JSDoc with examples
- [ ] Unit tests for interpolation, snapping
- [ ] Documentation updated

## Notes

- **2026-03-13**: Ticket created from approved design doc #25.
