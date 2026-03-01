---
id: TICKET-064
title: Join flow WebSocket connection validation
status: todo
priority: high
epic: EPIC-010
created: 2026-03-01
updated: 2026-03-01
---

# TICKET-064: Join flow WebSocket connection validation

When joining a game, clicking Connect should attempt an actual WebSocket connection to the provided address. It should only succeed if: a server is running at that address, the host is already in the lobby, no one else is in the lobby, and the game hasn't started. Otherwise show a connection error.

## Acceptance Criteria

- [ ] Join flow attempts real WebSocket connection on Connect
- [ ] Shows "connecting..." status while attempting
- [ ] Shows error if server is unreachable
- [ ] Shows error if lobby is full or game already started
- [ ] Only resolves successfully when connection is established and validated
- [ ] User can go back/retry after an error
- [ ] Tests cover connection success and failure scenarios
