---
id: TICKET-098
epic: EPIC-015
title: Rematch over P2P
status: done
priority: medium
created: 2026-03-04
updated: 2026-03-04
branch: ticket-098-rematch-over-p2p
labels:
  - networking
  - gameplay
  - arena
---

## Description

Ensure the existing rematch functionality works correctly over the P2P
DataChannel connection. After a match ends, both players can rematch without
re-signaling — the existing DataChannel stays open and a new game session
starts over it.

## Acceptance Criteria

- [x] Rematch button works as normal after a P2P match
- [x] No re-signaling or new RTCPeerConnection needed for rematches
- [x] DataChannel remains open between matches
- [x] Game state resets cleanly for the new match
- [x] Handles case where one player disconnects during rematch negotiation
- [x] All tests pass

## Notes

- **2026-03-04**: Ticket created. Depends on TICKET-095 (WebRTC layer). Existing rematch logic (TICKET-089) should mostly work if the transport layer is swapped cleanly.
- **2026-03-04**: Implementation complete. Added `disconnectOnCleanup` option to `useConnection` so P2P transport survives world teardown. Added `detach()` to TransportService for clean handler removal without closing the transport. DataChannelTransport.connect() now fires peerJoin on re-entry when already open. Transport manually disconnected on menu exit. 3 new network tests, 563 total tests pass.
