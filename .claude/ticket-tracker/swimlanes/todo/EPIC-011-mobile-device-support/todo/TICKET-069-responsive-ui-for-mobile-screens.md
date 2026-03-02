---
id: TICKET-069
epic: EPIC-011
title: Responsive UI for mobile screens
status: todo
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

- [ ] All overlay text is readable on 375px-wide screens without overflow
- [ ] All buttons meet 44x44px minimum touch target size
- [ ] Buttons show visual feedback on touch (not just hover)
- [ ] Menu and lobby layouts work on portrait and landscape orientations
- [ ] No horizontal scrolling on mobile devices

## Notes

- **2026-03-01**: Ticket created.
