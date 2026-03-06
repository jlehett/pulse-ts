---
id: TICKET-089
epic: EPIC-013
title: Rematch button for local and online play
status: done
priority: medium
branch: ticket-089-rematch-button
created: 2026-03-02
updated: 2026-03-03
completed: 2026-03-03
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

- [x] Rematch button visible on the match-over screen
- [x] Local mode: rematch immediately restarts the match
- [x] Online mode: rematch requires mutual confirmation from both players
- [x] If one player declines or disconnects, return to menu
- [x] All tests pass

## Notes

- **2026-03-02**: Ticket created.
- **2026-03-03**: Starting implementation.
- **2026-03-03**: Implementation complete. Added RematchChannel, rematch button to MatchOverOverlayNode with online negotiation protocol, updated ArenaNode and main.ts with rematch callbacks. All 495 tests pass, lint clean.
