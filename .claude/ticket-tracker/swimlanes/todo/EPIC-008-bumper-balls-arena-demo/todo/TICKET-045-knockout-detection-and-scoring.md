---
id: TICKET-045
epic: EPIC-008
title: Knockout detection and scoring
status: todo
priority: high
created: 2026-02-26
updated: 2026-02-26
labels:
  - arena
  - gameplay
  - network
---

## Description

Death-plane detection in `LocalPlayerNode` — when player falls below `DEATH_PLANE_Y`, publish `KnockoutChannel`. `GameManagerNode` subscribes to knockout events, tracks scores in `GameCtx`. `ScoreHudNode` renders a DOM overlay showing current scores. Respawn player on knockout.

## Acceptance Criteria

- [ ] Death-plane check in `LocalPlayerNode` fixed update
- [ ] `KnockoutChannel` published when local player falls off
- [ ] `GameManagerNode` subscribes to `KnockoutChannel` and updates scores
- [ ] Scores stored in `GameCtx` context
- [ ] `ScoreHudNode` renders DOM overlay with P1/P2 scores
- [ ] Player respawns at spawn position after knockout

## Notes

- **2026-02-26**: Ticket created.
