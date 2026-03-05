---
id: TICKET-095
epic: EPIC-015
title: WebRTC P2P network layer
status: done
priority: high
created: 2026-03-04
updated: 2026-03-04
branch: ticket-095-webrtc-p2p-network-layer
labels:
  - networking
  - webrtc
  - arena
---

## Description

Replace the current WebSocket-based game networking in the arena demo with
WebRTC RTCDataChannel for peer-to-peer game state sync. The signaling server
(TICKET-094) is used only for the initial connection handshake; all gameplay
data flows directly between browsers over the DataChannel.

## Acceptance Criteria

- [x] RTCPeerConnection established via signaling server handshake
- [x] RTCDataChannel created for reliable game state messages
- [x] Existing game state sync (transform replication, knockouts, scoring) works over DataChannel
- [x] Connection state monitoring (disconnect detection, error handling)
- [x] No WebSocket dependency for gameplay traffic after handshake completes
- [x] Latency comparable to or better than previous WebSocket approach
- [x] All tests pass

## Notes

- **2026-03-04**: Ticket created. May need to adapt or replace the `packages/network` WebSocket transport with a DataChannel transport.
- **2026-03-04**: Starting implementation.
- **2026-03-04**: Implementation complete. Created `DataChannelTransport` in `@pulse-ts/network` (14 tests). Rewrote lobby to use Lambda signaling protocol with WebRTC handshake (25 tests). Updated ArenaNode to accept Transport directly via `useConnection()`. All 493 arena tests + 55 network tests pass.
