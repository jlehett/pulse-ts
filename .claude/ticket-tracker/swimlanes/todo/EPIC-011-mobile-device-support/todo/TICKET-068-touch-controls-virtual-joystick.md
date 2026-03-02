---
id: TICKET-068
epic: EPIC-011
title: "Touch controls — virtual joystick and action buttons"
status: todo
priority: critical
created: 2026-03-01
updated: 2026-03-01
branch: ticket-068-touch-controls-virtual-joystick
labels:
  - input
  - mobile
  - arena
---

## Description

Add on-screen touch controls so the arena demo is playable on mobile devices. Create a
`TouchControlsNode` that renders a virtual joystick (for movement) and on-screen buttons
(dash, pause). Feed touch input into the existing input system via pointer events. Controls
should only appear on touch-capable devices and not interfere with keyboard input on desktop.

Key files: `packages/input/src/`, `demos/arena/src/config/bindings.ts`, new `TouchControlsNode`.

## Acceptance Criteria

- [ ] Virtual joystick controls player movement on touch devices
- [ ] On-screen dash button triggers dash action
- [ ] On-screen pause button triggers pause
- [ ] Controls only appear on touch-capable devices (not on desktop)
- [ ] Controls don't interfere with existing keyboard input
- [ ] Works on iOS Safari and Android Chrome

## Notes

- **2026-03-01**: Ticket created. This is the critical blocker — without it the game is unplayable on mobile.
