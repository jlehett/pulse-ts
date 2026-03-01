---
id: TICKET-062
title: Host pre-game lobby waiting room
status: done
priority: high
epic: EPIC-010
branch: ticket-063-remove-leaderboard
created: 2026-03-01
updated: 2026-03-01
---

# TICKET-062: Host pre-game lobby waiting room

When hosting a game, the host should wait in a lobby for the joiner to connect before the game starts. Currently the host clicks "Start" immediately with no awareness of whether anyone has joined.

## Acceptance Criteria

- [x] Host enters a waiting screen after clicking Start
- [x] Waiting screen shows connection status (waiting for opponent)
- [x] Host is notified when opponent connects
- [x] Game only starts once both players are connected
- [x] Host can go back/cancel while waiting
- [x] Tests cover the lobby waiting flow

## Notes

- **2026-03-01**: Implemented WebSocket lobby protocol. Host connects to relay server, waits for join-request from opponent, shows "Opponent connected!" and Start Game button. Host sends host-accept with joiner's player ID, then game-start when ready. 80 tests pass.
