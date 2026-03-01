---
id: TICKET-058
epic: EPIC-009
title: Main menu screen
status: done
priority: medium
created: 2026-03-01
updated: 2026-03-01
branch: ticket-058-main-menu-screen
labels:
  - arena
  - ui
---

## Description

Replace the current instant-start flow with a title screen. The menu shows the game title and two buttons: "Local Play" and "Online Play". Local Play launches the existing single-canvas 2-player game immediately. Online Play navigates to the lobby screen (TICKET-059). The menu is a DOM overlay on top of the canvas.

## Acceptance Criteria

- [x] Title screen appears on load with game title and two mode buttons
- [x] "Local Play" starts the current single-canvas 2-player game
- [x] "Online Play" transitions to the lobby UI (TICKET-059)
- [x] Menu is a DOM overlay, styled consistently with existing HUD elements
- [x] Unit tests for menu state transitions

## Notes

- **2026-03-01**: Status changed to in-progress. Implementing main menu screen.
- **2026-03-01**: Created `menu.ts` with `showMainMenu()` (promise-based DOM overlay). Refactored `main.ts` to show menu first — Local Play starts game, Online Play re-shows menu (placeholder for TICKET-059). 7 new tests, 64 total pass, lint clean. Status changed to done.
