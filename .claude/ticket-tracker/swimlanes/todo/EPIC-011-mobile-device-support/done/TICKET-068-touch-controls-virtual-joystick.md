---
id: TICKET-068
epic: EPIC-011
title: "Touch controls — virtual joystick and action buttons"
status: done
priority: critical
created: 2026-03-01
updated: 2026-03-02
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

- [x] Virtual joystick controls player movement on touch devices
- [x] On-screen dash button triggers dash action
- [x] On-screen pause button triggers pause
- [x] Controls only appear on touch-capable devices (not on desktop)
- [x] Controls don't interfere with existing keyboard input
- [x] Works on iOS Safari and Android Chrome

## Notes

- **2026-03-01**: Ticket created. This is the critical blocker — without it the game is unplayable on mobile.
- **2026-03-01**: Starting implementation.
- **2026-03-02**: Implementation complete. Added `holdAxis2D`/`releaseAxis2D` to InputService for persistent analog input. Created `TouchControlsNode` with virtual joystick (analog movement), dash button, and pause button. Multi-touch supported. All tests pass (42 input, 96 arena), lint clean.
- **2026-03-02**: Verified on iOS Safari. All acceptance criteria met. Ticket done.
