---
id: TICKET-083
epic: EPIC-013
title: Score HUD redesign
status: in-progress
priority: medium
created: 2026-03-02
updated: 2026-03-02
branch: ticket-083-score-hud-redesign
labels:
  - ui
  - arena
---

## Description

Replace the current score HUD with a sleeker design. Remove "P1:" and "P2:" labels —
just show scores on player-colored pill/shield shapes with white numbers. Players can
tell who is who by the colors (teal = P1, coral = P2). Score increase animation should
trigger after the instant replay, during the next-round transition phase.

## Acceptance Criteria

- [ ] No "P1:" / "P2:" text labels — just numbers
- [ ] Scores displayed on sleek colored shapes (teal for P1, coral for P2)
- [ ] Numbers are white on the colored backgrounds
- [ ] Score increase animation plays after replay during round transition
- [ ] All tests pass

## Notes

- **2026-03-02**: Ticket created.
- Depends on TICKET-082 (instant replay) for score animation timing.
