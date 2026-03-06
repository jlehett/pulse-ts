---
id: TICKET-105
epic: EPIC-017
title: Same-version enforcement on connect
status: done
priority: high
branch: ticket-105-same-version-enforcement-on-connect
created: 2026-03-05
updated: 2026-03-05
labels:
  - network
  - arena
---

## Description

Ensure two online players can only start a match if they are running the same
frontend version. This prevents physics/knockback disagreements caused by
mismatched client code.

### Implementation

1. **Version exchange during lobby:** When a player joins a room (or during the
   WebRTC handshake / game-start signaling), include `__APP_VERSION__` in the
   message payload.
2. **Comparison:** Both clients compare the received version with their own.
3. **Mismatch handling:** If versions differ, show a message to the stale client
   ("Your game is out of date — refreshing...") and trigger a page reload. The
   fresh client shows "Waiting for opponent to update..." or returns to lobby.
4. **Where to check:** The natural place is the `game-start` signaling message
   or an initial channel message after WebRTC connects, before the countdown
   begins.

### Files to touch

- `demos/arena/src/lobby.ts` — include version in game-start or handshake
- `demos/arena/infra/lambda/src/index.ts` — pass version through if needed
- `demos/arena/src/nodes/GameManagerNode.ts` or `ArenaNode.ts` — version
  mismatch UI

## Acceptance Criteria

- [x] Version is exchanged between peers before match start
- [x] Mismatched versions prevent match from starting
- [x] Stale client is prompted to refresh with a clear message
- [x] Fresh client returns to lobby or shows a waiting state
- [x] Same-version clients connect and play normally (no regression)
- [x] Tests cover version comparison logic

## Notes

- **2026-03-05**: Ticket created.
- **2026-03-05**: Starting implementation.
- **2026-03-05**: Implementation complete. Version exchanged via lobby signaling
  (create-lobby/join-lobby). Both host and joiner compare versions on
  joiner-connected/join-accepted. Mismatch screen shows reload for stale client
  or back-to-lobby for fresh client. Added `versionMatch.ts` with comparison
  logic and full test coverage (8 tests). Updated Lambda to store/forward
  hostVersion. Added 8 lobby tests for version enforcement flows.
