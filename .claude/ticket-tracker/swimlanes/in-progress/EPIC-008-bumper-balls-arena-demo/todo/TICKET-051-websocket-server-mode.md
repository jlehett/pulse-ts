---
id: TICKET-051
epic: EPIC-008
title: WebSocket server mode
status: todo
priority: low
created: 2026-02-26
updated: 2026-02-28
labels:
  - arena
  - network
  - websocket
---

## Description

`server.ts` using `attachWsServer` for optional WebSocket multiplayer mode. URL param `?mode=ws&player=p1` switches main.ts from MemoryHub to WebSocket transport. Single canvas mode (one player per browser tab). Same game nodes, different transport.

## Acceptance Criteria

- [x] `server.ts` creates a WebSocket server using `attachWsServer`
- [ ] URL param `?mode=ws` switches transport from MemoryHub to WebSocket
- [ ] URL param `&player=p1` or `&player=p2` selects which player to control
- [ ] Single canvas mode when in WebSocket mode
- [ ] Same game nodes work with both transport modes

## Notes

- **2026-02-26**: Ticket created.
- **2026-02-28**: Status changed to in-progress
- **2026-02-28**: Implemented server.ts relay, dual-mode main.ts, ArenaNode transport switching, solo canvas in index.html. 55 tests pass.
- **2026-02-28**: Status changed to done
- **2026-02-28**: Reopened. TICKET-053 (split-screen canvas fix) removed all client-side WebSocket integration as part of cleanup: URL param handling removed from main.ts, `#solo` canvas removed from index.html, `useWebSocket`/`wsUrl` prop removed from ArenaNode, `ws` dependency removed from package.json. The server-side code (`server.ts`) still exists. To resolve: re-add `ws` dependency, restore the `#solo` canvas and display toggle in index.html, re-add `wsUrl` prop and `useWebSocket` conditional to ArenaNode, and restore URL param parsing and `startWebSocket()` function in main.ts.
