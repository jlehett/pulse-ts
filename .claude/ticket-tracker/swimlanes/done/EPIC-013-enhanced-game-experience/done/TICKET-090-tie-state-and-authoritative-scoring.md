---
id: TICKET-090
epic: EPIC-013
title: Tie state detection and authoritative scoring
status: done
priority: high
created: 2026-03-02
updated: 2026-03-02
branch: ticket-090-tie-state-and-authoritative-scoring
labels:
  - gameplay
  - networking
  - arena
  - bug
---

## Description

Two related scoring fixes for online play:

**Tie detection:** When both players fall off the platform at approximately the
same time, the round should be declared a "Tie" and neither player gets a point.
Define a time window (e.g., within N frames) for simultaneous knockouts.

**Authoritative scoring:** Designate one player (the host) as the authority on
scoring outcomes. Currently both clients independently determine who scored,
which can lead to disagreements where P1 thinks they scored and P2 thinks they
scored. The host's scoring decision should be authoritative and replicated to
the other player.

## Acceptance Criteria

- [x] Simultaneous knockouts within a defined time window result in a "Tie"
- [x] Tie rounds award no points to either player
- [x] Visual feedback for tie state (e.g., "Tie!" overlay)
- [x] One player (host) is authoritative for scoring decisions in online mode
- [x] Non-host player accepts and displays the host's scoring outcome
- [x] Score disagreements between clients are no longer possible
- [x] All tests pass

## Notes

- **2026-03-02**: Ticket created.
- Bug context: observed instances where each player's client registered a different winner for the same round.
- **2026-03-02**: Starting implementation.
- **2026-03-02**: Implementation complete. Tie window detection (10 frames/~167ms), authoritative scoring via ScoringOutcomeChannel, "Tie!" overlay, midpoint camera follow during tie replays. All 356 tests pass, lint clean.
