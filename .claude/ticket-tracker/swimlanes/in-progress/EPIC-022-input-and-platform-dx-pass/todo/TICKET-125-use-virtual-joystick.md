---
id: TICKET-125
epic: EPIC-022
title: useVirtualJoystick Hook
status: todo
priority: medium
created: 2026-03-13
updated: 2026-03-13
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

- [ ] `useVirtualJoystick(options)` creates a touch joystick
- [ ] Injects into input system as an Axis2D binding
- [ ] Dead zone and normalization handled by the hook
- [ ] `render` callback receives reactive state (position, angle, magnitude, active)
- [ ] Default visual rendering if no `render` callback provided
- [ ] Works on touch devices
- [ ] JSDoc with examples
- [ ] Unit tests for touch math, dead zone, input injection
- [ ] Documentation updated

## Notes

- **2026-03-13**: Ticket created from approved design doc #15.
