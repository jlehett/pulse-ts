---
paths:
  - "packages/network/src/infra/server/core/NetworkServer.ts"
  - "packages/network/src/domain/services/TransportService.ts"
  - "packages/network/src/domain/messaging/reserved.ts"
  - "packages/network/src/public/hooks.ts"
---

# Peer-Leave Mechanism

- When a peer disconnects (WebSocket close or error), `NetworkServer.removePeer()` broadcasts a `__peer_leave` reserved channel packet to all remaining room members *before* removing the peer from the room set — this ensures every other client learns exactly who left, rather than just losing their packets
- `TransportService.dispatchIncoming()` intercepts `__peer_leave` packets and emits `onPeerLeave(peerId)` so that higher-level code can react to disconnects
- `usePeers()` listens to `onPeerLeave` and automatically removes the departed peer from its tracked set — application code does not need to manually manage peer removal on disconnect
- `useOnPeerLeave(handler)` is the public hook for application-level disconnect handling (e.g., showing "player left" messages); it wraps a subscription to `TransportService.onPeerLeave`
- The `ReservedChannels.PEER_LEAVE` constant is defined as `'__peer_leave'` and is intentionally separate from other reserved channels like `__room` (join/leave actions) to allow per-client disconnect notifications
