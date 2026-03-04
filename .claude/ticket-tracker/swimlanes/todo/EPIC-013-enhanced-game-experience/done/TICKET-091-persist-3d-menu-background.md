---
id: TICKET-091
epic: EPIC-013
title: Persist 3D menu background across all menus
status: done
priority: medium
branch: ticket-091-persist-3d-menu-background
created: 2026-03-03
updated: 2026-03-03
labels:
  - ui
  - arena
---

## Description

The 3D arena background (orbiting camera over platform, nebula, starfield) only showed
behind the main menu. Selecting "Online Play" called `menuWorld.destroy()` immediately,
killing the 3D scene before the lobby screens appeared — lobby rendered over a black canvas.

## Acceptance Criteria

- [x] 3D background visible behind main menu AND all lobby screens
- [x] Lobby overlay opacity reduced to let background show through
- [x] "Back" from lobby returns to main menu without jitter/reset
- [x] menuWorld only destroyed when an actual game mode starts
- [x] All tests pass
- [x] Lint clean

## Notes

- **2026-03-03**: Ticket created and completed.
- **2026-03-03**: Moved `menuWorld.destroy()` into each game-start branch. Reduced lobby overlay opacity from 0.92 to 0.65. Added while loop in `start()` to keep menu world alive when navigating back from lobby.
