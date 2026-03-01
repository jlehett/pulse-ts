---
id: TICKET-061
title: Return to main menu from game
status: todo
priority: high
epic: EPIC-010
created: 2026-03-01
updated: 2026-03-01
---

# TICKET-061: Return to main menu from game

Currently there's no way to get back to the main menu without reloading the page. Add a mechanism (e.g., after match ends or via an escape key) to tear down the running world and return to the main menu.

## Acceptance Criteria

- [ ] Player can return to the main menu from within a game
- [ ] World is properly destroyed/stopped when returning
- [ ] Main menu is fully functional again after returning
- [ ] Works for both local and online game modes
- [ ] Tests cover the new flow
