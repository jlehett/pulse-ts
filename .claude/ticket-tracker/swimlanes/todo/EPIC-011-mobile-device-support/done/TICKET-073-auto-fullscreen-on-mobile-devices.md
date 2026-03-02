---
id: TICKET-073
epic: EPIC-011
title: Auto-fullscreen on mobile devices
status: done
priority: high
created: 2026-03-02
updated: 2026-03-02
branch: ticket-073-auto-fullscreen-on-mobile-devices
labels:
  - mobile
  - ui
  - arena
---

## Description

On mobile devices, the game should enter fullscreen mode automatically on the user's
first touch/tap interaction. This maximizes screen real estate and is required for the
Screen Orientation Lock API (TICKET-071) to work.

Use `document.documentElement.requestFullscreen()` triggered by the first user gesture
(tap/touch). The Fullscreen API requires a user-initiated event, so this must be hooked
to an actual interaction like a touchstart or click.

## Acceptance Criteria

- [x] On mobile devices, the first tap/touch triggers fullscreen mode
- [x] Fullscreen request only fires on mobile devices (not desktop)
- [x] If the browser denies the fullscreen request, the game continues normally
- [x] No console errors on browsers that don't support the Fullscreen API
- [x] Pairs with TICKET-071 for orientation lock after fullscreen is granted

## Notes

- **2026-03-02**: Ticket created.
- **2026-03-02**: Starting implementation.
- **2026-03-02**: Implementation complete. Created `autoFullscreen.ts` with `initAutoFullscreen()` — one-shot touchstart listener that requests fullscreen on first touch, gated to mobile devices. 6 new tests, all 110 pass, lint clean.
