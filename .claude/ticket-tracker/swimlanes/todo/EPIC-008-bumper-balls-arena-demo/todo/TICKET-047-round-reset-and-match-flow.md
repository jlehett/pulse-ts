---
id: TICKET-047
epic: EPIC-008
title: Round reset and match flow
status: todo
priority: medium
created: 2026-02-26
updated: 2026-02-26
labels:
  - arena
  - gameplay
  - ui
---

## Description

`KnockoutOverlayNode` — DOM overlay for KO flash, round winner announcement, and match winner display. Round reset logic: respawn both players at spawn positions with a brief countdown. Match end state when a player reaches `WIN_COUNT`.

## Acceptance Criteria

- [ ] `KnockoutOverlayNode` displays KO flash on knockout
- [ ] Round winner displayed briefly after each knockout
- [ ] Match winner displayed when a player reaches WIN_COUNT
- [ ] Round reset respawns both players at spawn positions
- [ ] Brief countdown before round resumes
- [ ] GameManagerNode orchestrates round/match state transitions

## Notes

- **2026-02-26**: Ticket created.
