---
id: TICKET-064
title: Join flow WebSocket connection validation
status: done
priority: high
epic: EPIC-010
branch: ticket-063-remove-leaderboard
created: 2026-03-01
updated: 2026-03-01
---

# TICKET-064: Join flow WebSocket connection validation

When joining a game, clicking Connect should attempt an actual WebSocket connection to the provided address. It should only succeed if: a server is running at that address, the host is already in the lobby, no one else is in the lobby, and the game hasn't started. Otherwise show a connection error.

## Acceptance Criteria

- [x] Join flow attempts real WebSocket connection on Connect
- [x] Shows "connecting..." status while attempting
- [x] Shows error if server is unreachable
- [x] Shows error if lobby is full or game already started
- [x] Only resolves successfully when connection is established and validated
- [x] User can go back/retry after an error
- [x] Tests cover connection success and failure scenarios

## Notes

- **2026-03-01**: Implemented alongside TICKET-062. Joiner connects WebSocket, sends join-request, validates host-accept response within 5s timeout. Handles lobby-full rejection. Waits for game-start before resolving. Full error handling with retry support. 80 tests pass.
