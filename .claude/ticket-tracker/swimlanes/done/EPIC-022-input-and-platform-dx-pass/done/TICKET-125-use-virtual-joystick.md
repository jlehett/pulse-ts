---
id: TICKET-125
epic: EPIC-022
title: useVirtualJoystick Hook
status: done
priority: medium
created: 2026-03-13
updated: 2026-03-14
labels:
  - input
  - dx
  - mobile
---

## Description

Implement `useVirtualJoystick` in `@pulse-ts/input` with a pluggable visual layer.
The hook owns touch math (dead zone, normalization, input injection). Visual rendering
is customizable via a `render` callback that receives `JoystickRenderState` with reactive
getters.

Design doc: `design-docs/approved/015-use-virtual-joystick.md`

## Acceptance Criteria

- [x] `useVirtualJoystick(options)` creates a touch joystick
- [x] Injects into input system as an Axis2D binding
- [x] Dead zone and normalization handled by the hook
- [x] `render` callback receives reactive state (position, angle, magnitude, active)
- [x] Default visual rendering if no `render` callback provided
- [x] Works on touch devices
- [x] JSDoc with examples
- [x] Unit tests for touch math, dead zone, input injection
- [x] Documentation updated

## Notes

- **2026-03-13**: Ticket created from approved design doc #15.
- **2026-03-14**: Moved to in-progress.
- **2026-03-14**: Implementation complete. All 79 tests passing, lint clean.
