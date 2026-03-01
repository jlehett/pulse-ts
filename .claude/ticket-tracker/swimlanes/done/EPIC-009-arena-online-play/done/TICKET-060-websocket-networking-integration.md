---
id: TICKET-060
epic: EPIC-009
title: WebSocket networking integration
status: done
priority: medium
created: 2026-03-01
updated: 2026-03-01
branch: ticket-060-websocket-networking-integration
labels:
  - arena
  - network
  - websocket
---

## Description

Wire up the WebSocket transport so two players on different machines can play. Re-add `ws` dependency, restore `ArenaNode` props for network mode (`playerId`, `wsUrl`), restore `RemotePlayerNode` with transform replication, and connect the lobby UI (TICKET-059) to the actual networking layer. The existing `server.ts` relay is already intact. Same game nodes (GameManager, scoring, HUD, effects) work in both local and online modes.

## Acceptance Criteria

- [x] `ws` dependency re-added to package.json
- [x] `ArenaNode` accepts props for network mode (playerId, wsUrl)
- [x] `RemotePlayerNode` restored with `useReplicateTransform` consumer role
- [x] `LocalPlayerNode` works for a single assigned player in online mode
- [x] `server.ts` relay works with the new client-side integration
- [x] Game state (scoring, knockouts, match flow) syncs correctly between players
- [x] Configurable host address (from lobby UI) instead of hardcoded localhost
- [x] Unit tests for network mode setup and RemotePlayerNode

## Notes

- **2026-03-01**: Ticket created. Supersedes TICKET-051 from EPIC-008. The server-side `server.ts` already exists and is functional.
- **2026-03-01**: Status changed to in-progress.
- **2026-03-01**: Implemented distributed authority networking. ArenaNode accepts optional playerId/wsUrl props for online mode. LocalPlayerNode gains `replicate` prop for producer mode. RemotePlayerNode gets knockout detection. main.ts adds startOnlineGame() with installNetwork. Lobby wires configurable host address. ws dependency re-added. 80 tests pass, lint clean. Status changed to done.
