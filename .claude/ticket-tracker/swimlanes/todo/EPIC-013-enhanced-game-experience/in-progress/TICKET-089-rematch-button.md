---
id: TICKET-089
epic: EPIC-013
title: Rematch button for local and online play
status: in-progress
priority: medium
branch: ticket-089-rematch-button
created: 2026-03-02
updated: 2026-03-03
labels:
  - ui
  - gameplay
  - arena
---

## Description

Add a "Rematch" button to the match-over screen for both local and online play.
In local mode, rematch should immediately restart with the same players. In
online mode, both players must agree to rematch (mutual confirmation) before
restarting.

## Acceptance Criteria

- [ ] Rematch button visible on the match-over screen
- [ ] Local mode: rematch immediately restarts the match
- [ ] Online mode: rematch requires mutual confirmation from both players
- [ ] If one player declines or disconnects, return to menu
- [ ] All tests pass

## Notes

- **2026-03-02**: Ticket created.
- **2026-03-03**: Starting implementation.
