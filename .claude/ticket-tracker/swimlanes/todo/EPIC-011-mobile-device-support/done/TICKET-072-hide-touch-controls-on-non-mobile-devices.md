---
id: TICKET-072
epic: EPIC-011
title: Hide touch controls on non-mobile devices
status: done
priority: high
created: 2026-03-02
updated: 2026-03-02
branch: ticket-072-hide-touch-controls-on-non-mobile-devices
labels:
  - mobile
  - ui
  - arena
---

## Description

TouchControlsNode currently gates rendering on `navigator.maxTouchPoints > 0`, but some
desktop browsers (especially touch-enabled laptops) report touch support, causing the
virtual joystick, dash button, and pause button to appear on non-mobile devices where
they are not needed.

Improve the device detection heuristic to reliably distinguish mobile devices from
desktop/laptop touch screens. Consider checking for a combination of `maxTouchPoints`,
screen dimensions, `pointer: coarse` media query, or user-agent heuristics.

## Acceptance Criteria

- [x] Touch controls (joystick, dash button, pause button) are hidden on desktop/laptop browsers
- [x] Touch controls still appear on phones and tablets
- [x] Touch-enabled laptops do not show touch controls
- [x] No regression for actual mobile devices

## Notes

- **2026-03-02**: Ticket created.
- **2026-03-02**: Starting implementation.
- **2026-03-02**: Implementation complete. Extracted shared `isMobileDevice()` utility using `pointer: coarse` media query (falls back to `maxTouchPoints`). Replaced checks in TouchControlsNode, landscapeEnforcer, and autoFullscreen. 3 new tests for the utility, updated all related test suites. All 125 tests pass, lint clean.
