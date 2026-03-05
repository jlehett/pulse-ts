---
id: TICKET-097
epic: EPIC-015
title: Lobby UI (host and browse/join)
status: done
priority: medium
created: 2026-03-04
updated: 2026-03-04
branch: ticket-097-lobby-ui-host-and-join
labels:
  - ui
  - networking
  - arena
---

## Description

Replace the current online play menu flow with a lobby-based system. The host
creates a lobby and waits on a lobby screen. The joiner sees a list of open
lobbies with host usernames and clicks to join. Joining triggers the WebRTC
P2P handshake and starts the game.

## Acceptance Criteria

- [x] "Host Match" option creates a lobby via signaling server and shows a waiting screen
- [x] "Join Match" option fetches and displays a list of open lobbies from the signaling server
- [x] Each lobby entry shows the host's username
- [x] Lobby list refreshes periodically or on user action
- [x] Clicking a lobby initiates the P2P connection via signaling
- [x] Game starts automatically once the P2P connection is established
- [x] Host waiting screen shows a cancel/back option
- [x] Handles edge cases: lobby disappears before join, connection failure
- [x] All tests pass

## Notes

- **2026-03-04**: Ticket created. Depends on TICKET-094 (signaling server) and TICKET-095 (WebRTC layer).
- **2026-03-04**: All acceptance criteria were fulfilled during TICKET-095 (WebRTC P2P migration) and TICKET-096 (Username system) implementation. Closing as complete — no additional work needed.
