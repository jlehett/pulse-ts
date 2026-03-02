---
id: TICKET-067
title: "Network sync: score replication, round transitions, online pause, and disconnect handling"
status: done
priority: high
created: 2026-03-01
updated: 2026-03-01
labels: [network, arena, online]
---

## Description

Fix three desync issues in online arena play and add disconnect handling:

1. **Score replication** — Broadcast knockout events via `KnockoutChannel` so both machines see score updates and round transitions in sync.
2. **Round transitions** — `GameManagerNode` subscribes to `KnockoutChannel` when online, driving the state machine identically on both machines.
3. **Online pause** — `PauseMenuNode` becomes overlay-only in online mode (no `gameState.paused = true`), preventing abuse and desync.
4. **RemotePlayerNode cleanup** — Skip unreliable death-plane check in online mode; knockouts arrive via the channel instead.
5. **Disconnect handling** — Server broadcasts `__peer_leave` to remaining room members when a peer disconnects. New `useOnPeerLeave` hook in the network package. New `DisconnectOverlayNode` shows contextual message ("Host ended the match" / "The other player left the match") and returns to menu.

## Acceptance Criteria

- [x] Both machines see score updates when a player falls off in online mode
- [x] Round transitions (ko_flash → resetting → countdown → playing) sync across machines
- [x] Escape in online mode shows overlay without freezing physics
- [x] Local mode pause still freezes the game as before
- [x] Server broadcasts `__peer_leave` when a peer disconnects
- [x] `TransportService` intercepts `__peer_leave` and emits `onPeerLeave`
- [x] `useOnPeerLeave` hook exported from `@pulse-ts/network`
- [x] Disconnect overlay shows correct message based on host/joiner role
- [x] All tests pass (`npm test -w packages/network`, `npm test -w demos/arena`)
- [x] Lint clean (`npx nx lint network`, `npx eslint demos/arena/src/`)
