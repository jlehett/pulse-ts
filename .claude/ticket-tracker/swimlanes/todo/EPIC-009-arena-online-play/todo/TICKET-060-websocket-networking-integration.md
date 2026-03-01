---
id: TICKET-060
epic: EPIC-009
title: WebSocket networking integration
status: todo
priority: medium
created: 2026-03-01
updated: 2026-03-01
labels:
  - arena
  - network
  - websocket
---

## Description

Wire up the WebSocket transport so two players on different machines can play. Re-add `ws` dependency, restore `ArenaNode` props for network mode (`playerId`, `wsUrl`), restore `RemotePlayerNode` with transform replication, and connect the lobby UI (TICKET-059) to the actual networking layer. The existing `server.ts` relay is already intact. Same game nodes (GameManager, scoring, HUD, effects) work in both local and online modes.

## Acceptance Criteria

- [ ] `ws` dependency re-added to package.json
- [ ] `ArenaNode` accepts props for network mode (playerId, wsUrl)
- [ ] `RemotePlayerNode` restored with `useReplicateTransform` consumer role
- [ ] `LocalPlayerNode` works for a single assigned player in online mode
- [ ] `server.ts` relay works with the new client-side integration
- [ ] Game state (scoring, knockouts, match flow) syncs correctly between players
- [ ] Configurable host address (from lobby UI) instead of hardcoded localhost
- [ ] Unit tests for network mode setup and RemotePlayerNode

## Notes

- **2026-03-01**: Ticket created. Supersedes TICKET-051 from EPIC-008. The server-side `server.ts` already exists and is functional.
