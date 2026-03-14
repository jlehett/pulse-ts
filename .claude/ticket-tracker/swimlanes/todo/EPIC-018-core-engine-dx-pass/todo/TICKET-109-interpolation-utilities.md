---
id: TICKET-109
epic: EPIC-018
title: Interpolation Utilities
status: todo
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

- [ ] `lerp(a, b, t)` — linear interpolation
- [ ] `inverseLerp(a, b, value)` — inverse of lerp
- [ ] `damp(current, target, smoothing, dt)` — frame-rate independent smoothing
- [ ] `smoothstep(edge0, edge1, x)` — Hermite interpolation
- [ ] `clamp(value, min, max)` — value clamping
- [ ] `remap(value, inMin, inMax, outMin, outMax)` — range remapping
- [ ] All functions are pure, no dependencies
- [ ] JSDoc with examples on all public APIs
- [ ] Unit tests for all functions including edge cases
- [ ] Documentation updated

## Notes

- **2026-03-13**: Ticket created from approved design doc #19.
