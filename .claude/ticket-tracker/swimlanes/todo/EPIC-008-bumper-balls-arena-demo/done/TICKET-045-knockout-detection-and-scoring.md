---
id: TICKET-045
epic: EPIC-008
title: Knockout detection and scoring
status: done
priority: high
branch: ticket-045-knockout-detection-and-scoring
created: 2026-02-26
updated: 2026-02-28
labels:
  - arena
  - gameplay
  - network
---

## Description

Death-plane detection in `LocalPlayerNode` — when player falls below `DEATH_PLANE_Y`, publish `KnockoutChannel`. `GameManagerNode` subscribes to knockout events, tracks scores in `GameCtx`. `ScoreHudNode` renders a DOM overlay showing current scores. Respawn player on knockout.

## Acceptance Criteria

- [x] Death-plane check in `LocalPlayerNode` fixed update
- [x] `KnockoutChannel` published when local player falls off
- [x] `GameManagerNode` subscribes to `KnockoutChannel` and updates scores
- [x] Scores stored in `GameCtx` context
- [x] `ScoreHudNode` renders DOM overlay with P1/P2 scores
- [x] Player respawns at spawn position after knockout

## Notes

- **2026-02-26**: Ticket created.
- **2026-02-28**: Starting implementation.
- **2026-02-28**: Complete. LocalPlayerNode publishes KnockoutChannel on death plane. GameManagerNode subscribes and increments opposing player score. ScoreHudNode renders centered DOM overlay with P1/P2 scores. 21 passing tests.
