---
id: TICKET-124
epic: EPIC-022
title: Input Binding Shorthand (Axis2D.keys / wasd / arrows)
status: done
priority: low
created: 2026-03-13
updated: 2026-03-13
labels:
  - input
  - dx
---

## Description

Add static shorthand methods to `Axis2D` in `@pulse-ts/input`: `Axis2D.keys(left, right, down, up)`,
`Axis2D.wasd()`, and `Axis2D.arrows()`. Reduces the most common 2D axis bindings from
3 lines of nested constructors to a single call.

Design doc: `design-docs/approved/037-input-binding-shorthand.md`

## Acceptance Criteria

- [x] `Axis2D.keys(left, right, down, up)` creates a 2D axis from four key codes
- [x] `Axis2D.wasd()` preset for WASD keys
- [x] `Axis2D.arrows()` preset for arrow keys
- [x] Parameter order: left, right, down, up (X-axis first, then Y-axis)
- [x] Full form `Axis2D({ x: Axis1D(...), y: Axis1D(...) })` still available
- [x] JSDoc with examples
- [x] Unit tests for all shorthands
- [x] Documentation updated

## Notes

- **2026-03-13**: Ticket created from approved design doc #37.
