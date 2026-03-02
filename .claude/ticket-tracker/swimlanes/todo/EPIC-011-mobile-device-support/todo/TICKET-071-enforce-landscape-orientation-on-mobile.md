---
id: TICKET-071
epic: EPIC-011
title: Enforce landscape orientation on mobile devices
status: todo
priority: high
created: 2026-03-02
updated: 2026-03-02
branch: ticket-071-enforce-landscape-orientation-on-mobile
labels:
  - mobile
  - ui
  - arena
---

## Description

On mobile devices, the vertical screen space is too small to fit the arena plus touch
controls. Enforce a landscape orientation using a two-pronged approach:

1. **Orientation Lock API** — Call `screen.orientation.lock('landscape')` when fullscreen
   is active. This is the preferred approach but only works in fullscreen and on supported
   browsers.
2. **CSS rotation fallback** — When the device is in portrait and orientation lock is
   unavailable or fails, show a "Please rotate your device" overlay that covers the game.
   This works universally as a fallback.

Pairs with TICKET-073 (auto-fullscreen), since orientation lock requires fullscreen mode.

## Acceptance Criteria

- [ ] On supported browsers in fullscreen, orientation is locked to landscape
- [ ] On unsupported browsers or when not fullscreen, a "rotate your device" overlay appears in portrait
- [ ] Overlay disappears immediately when the user rotates to landscape
- [ ] Desktop devices are unaffected
- [ ] No console errors on browsers that don't support the Orientation Lock API

## Notes

- **2026-03-02**: Ticket created.
