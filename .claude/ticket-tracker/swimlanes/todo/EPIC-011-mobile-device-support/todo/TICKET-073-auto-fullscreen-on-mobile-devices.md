---
id: TICKET-073
epic: EPIC-011
title: Auto-fullscreen on mobile devices
status: todo
priority: high
created: 2026-03-02
updated: 2026-03-02
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

- [ ] On mobile devices, the first tap/touch triggers fullscreen mode
- [ ] Fullscreen request only fires on mobile devices (not desktop)
- [ ] If the browser denies the fullscreen request, the game continues normally
- [ ] No console errors on browsers that don't support the Fullscreen API
- [ ] Pairs with TICKET-071 for orientation lock after fullscreen is granted

## Notes

- **2026-03-02**: Ticket created.
