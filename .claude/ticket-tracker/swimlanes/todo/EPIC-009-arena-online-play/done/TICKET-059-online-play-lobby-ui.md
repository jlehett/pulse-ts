---
id: TICKET-059
epic: EPIC-009
title: Online play lobby UI
status: done
priority: medium
created: 2026-03-01
updated: 2026-03-01
branch: ticket-059-online-play-lobby-ui
labels:
  - arena
  - ui
  - network
---

## Description

DOM overlay lobby screen for online play. Two options: "Host Game" and "Join Game". Host Game displays the local machine's IP/port for the other player to connect to. Join Game shows an input field for the host address. Both flows let the player pick P1 or P2. A "Back" button returns to the main menu. Once both players are connected, the game starts automatically.

## Acceptance Criteria

- [x] "Host Game" flow shows connection info (IP/port) for the other player
- [x] "Join Game" flow has an input field for host address
- [x] Player role selection (P1 or P2) — host only; joiner assigned by server
- [x] "Back" button returns to main menu
- [x] Connection status indicator (connecting, connected, error)
- [x] Game starts automatically when both players are connected
- [x] Unit tests for lobby state transitions

## Notes

- **2026-03-01**: Status changed to in-progress. Host picks player, joiner gets remaining. Join flow simplified to address input + connect.
- **2026-03-01**: Implemented `lobby.ts` with multi-screen state machine (lobby menu → host setup → host waiting, join setup). Wired into main.ts online flow. 16 new tests, 80 total pass, lint clean. Status changed to done.
