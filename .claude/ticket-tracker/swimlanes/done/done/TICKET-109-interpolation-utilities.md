---
id: TICKET-109
epic: EPIC-018
title: Interpolation Utilities
status: done
priority: medium
branch: ticket-109-interpolation-utilities
created: 2026-03-13
updated: 2026-03-13
labels:
  - core
  - math
---

## Description

Add pure math utility functions to `@pulse-ts/core`: `lerp`, `inverseLerp`, `damp`,
`smoothstep`, `clamp`, `remap`. Fundamental building blocks used across 10+ nodes
in the arena demo.

Design doc: `design-docs/approved/019-interpolation-utilities.md`

## Acceptance Criteria

- [x] `lerp(a, b, t)` — linear interpolation
- [x] `inverseLerp(a, b, value)` — inverse of lerp
- [x] `damp(current, target, smoothing, dt)` — frame-rate independent smoothing
- [x] `smoothstep(edge0, edge1, x)` — Hermite interpolation
- [x] `clamp(value, min, max)` — value clamping
- [x] `remap(value, inMin, inMax, outMin, outMax)` — range remapping
- [x] All functions are pure, no dependencies
- [x] JSDoc with examples on all public APIs
- [x] Unit tests for all functions including edge cases
- [x] Documentation updated

## Notes

- **2026-03-13**: Ticket created from approved design doc #19.
- **2026-03-13**: Implementation complete. 25 tests covering all functions and edge cases.
