---
id: TICKET-095
epic: EPIC-015
title: WebRTC P2P network layer
status: in-progress
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

- [ ] RTCPeerConnection established via signaling server handshake
- [ ] RTCDataChannel created for reliable game state messages
- [ ] Existing game state sync (transform replication, knockouts, scoring) works over DataChannel
- [ ] Connection state monitoring (disconnect detection, error handling)
- [ ] No WebSocket dependency for gameplay traffic after handshake completes
- [ ] Latency comparable to or better than previous WebSocket approach
- [ ] All tests pass

## Notes

- **2026-03-04**: Ticket created. May need to adapt or replace the `packages/network` WebSocket transport with a DataChannel transport.
- **2026-03-04**: Starting implementation.
