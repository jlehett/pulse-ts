---
id: TICKET-069
epic: EPIC-011
title: Responsive UI for mobile screens
status: done
priority: high
created: 2026-03-01
updated: 2026-03-02
branch: ticket-069-responsive-ui-for-mobile-screens
labels:
  - ui
  - mobile
  - arena
---

## Description

Make all DOM overlay text and buttons scale properly on small screens. Convert hardcoded
pixel font sizes (48px, 72px, 36px) to responsive sizes using `clamp()` or viewport units.
Increase touch targets to minimum 44x44px. Replace `mouseenter`/`mouseleave` hover effects
with pointer events that provide feedback on touch. Covers: `menu.ts`, `lobby.ts`,
`PauseMenuNode`, `ScoreHudNode`, `CountdownOverlayNode`, `MatchOverOverlayNode`,
`KnockoutOverlayNode`, `DisconnectOverlayNode`.

## Acceptance Criteria

- [x] All overlay text is readable on 375px-wide screens without overflow
- [x] All buttons meet 44x44px minimum touch target size
- [x] Buttons show visual feedback on touch (not just hover)
- [x] Menu and lobby layouts work on portrait and landscape orientations
- [x] No horizontal scrolling on mobile devices

## Notes

- **2026-03-01**: Ticket created.
- **2026-03-02**: Starting implementation.
- **2026-03-02**: Implementation complete. Replaced all hardcoded px fonts with `clamp()` responsive values across 7 files. Added `minHeight: 44px` to all buttons. Replaced `mouseenter`/`mouseleave` with `pointerdown`/`pointerup`/`pointerleave` for touch feedback. Added `flexWrap`/`justifyContent` to lobby row, `wordBreak: break-all` for URLs, `padding: 0 20px` for content wrappers, `maxWidth: 90vw` + `wordWrap: break-word` for disconnect message. All 96 tests pass, lint clean.
