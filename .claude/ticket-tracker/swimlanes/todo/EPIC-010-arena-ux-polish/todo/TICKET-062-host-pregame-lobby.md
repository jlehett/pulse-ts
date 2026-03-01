---
id: TICKET-062
title: Host pre-game lobby waiting room
status: todo
priority: high
epic: EPIC-010
created: 2026-03-01
updated: 2026-03-01
---

# TICKET-062: Host pre-game lobby waiting room

When hosting a game, the host should wait in a lobby for the joiner to connect before the game starts. Currently the host clicks "Start" immediately with no awareness of whether anyone has joined.

## Acceptance Criteria

- [ ] Host enters a waiting screen after clicking Start
- [ ] Waiting screen shows connection status (waiting for opponent)
- [ ] Host is notified when opponent connects
- [ ] Game only starts once both players are connected
- [ ] Host can go back/cancel while waiting
- [ ] Tests cover the lobby waiting flow
