---
id: TICKET-051
epic: EPIC-008
title: WebSocket server mode
status: in-progress
priority: low
created: 2026-02-26
updated: 2026-02-28
branch: ticket-051-websocket-server-mode
labels:
  - arena
  - network
  - websocket
---

## Description

`server.ts` using `attachWsServer` for optional WebSocket multiplayer mode. URL param `?mode=ws&player=p1` switches main.ts from MemoryHub to WebSocket transport. Single canvas mode (one player per browser tab). Same game nodes, different transport.

## Acceptance Criteria

- [ ] `server.ts` creates a WebSocket server using `attachWsServer`
- [ ] URL param `?mode=ws` switches transport from MemoryHub to WebSocket
- [ ] URL param `&player=p1` or `&player=p2` selects which player to control
- [ ] Single canvas mode when in WebSocket mode
- [ ] Same game nodes work with both transport modes

## Notes

- **2026-02-26**: Ticket created.
- **2026-02-28**: Status changed to in-progress
