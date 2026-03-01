---
id: TICKET-047
epic: EPIC-008
title: Round reset and match flow
status: done
priority: medium
created: 2026-02-26
updated: 2026-02-28
labels:
  - arena
  - gameplay
  - ui
branch: ticket-047-round-reset-and-match-flow
---

## Description

`KnockoutOverlayNode` — DOM overlay for KO flash, round winner announcement, and match winner display. Round reset logic: respawn both players at spawn positions with a brief countdown. Match end state when a player reaches `WIN_COUNT`.

## Acceptance Criteria

- [x] `KnockoutOverlayNode` displays KO flash on knockout
- [x] Round winner displayed briefly after each knockout
- [x] Match winner displayed when a player reaches WIN_COUNT
- [x] Round reset respawns both players at spawn positions
- [x] Brief countdown before round resumes
- [x] GameManagerNode orchestrates round/match state transitions

## Notes

- **2026-02-26**: Ticket created.
- **2026-02-28**: Implementation complete. Added full round lifecycle state machine (PLAYING→KO_FLASH→RESETTING→COUNTDOWN→PLAYING→MATCH_OVER), KnockoutOverlayNode with white flash + score text, CountdownOverlayNode (3-2-1-GO!), MatchOverOverlayNode (YOU WIN!/YOU LOSE!), input freezing during non-playing phases, and round-reset respawn via RoundResetChannel. All tests pass, lint clean.
