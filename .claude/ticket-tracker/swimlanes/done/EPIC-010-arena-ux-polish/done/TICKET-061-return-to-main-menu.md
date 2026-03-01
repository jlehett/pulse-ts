---
id: TICKET-061
title: Return to main menu from game
status: done
priority: high
epic: EPIC-010
branch: ticket-063-remove-leaderboard
created: 2026-03-01
updated: 2026-03-01
---

# TICKET-061: Return to main menu from game

Currently there's no way to get back to the main menu without reloading the page. Add a mechanism (e.g., after match ends or via an escape key) to tear down the running world and return to the main menu.

## Acceptance Criteria

- [x] Player can return to the main menu from within a game
- [x] World is properly destroyed/stopped when returning
- [x] Main menu is fully functional again after returning
- [x] Works for both local and online game modes
- [x] Tests cover the new flow

## Notes

- **2026-03-01**: Added "Main Menu" button to the match-over overlay. Clicking it calls world.stop() + world.clearScene(), resolves the game promise, and the start() loop shows the main menu again. Works for both local and online modes.
