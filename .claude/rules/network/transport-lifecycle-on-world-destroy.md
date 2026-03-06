---
paths:
  - "packages/network/src/public/hooks.ts"
  - "packages/network/src/domain/services/TransportService.ts"
---
# Transport Lifecycle on World Destroy

## Implicit Contract

`useConnection`'s `useInit` cleanup calls `svc.disconnect()`, which calls `transport.disconnect()`. For `DataChannelTransport`, this **closes both the RTCDataChannel and RTCPeerConnection permanently**.

Any code that destroys a world and expects to reuse the same transport instance (e.g., rematch) must use `disconnectOnCleanup: false`:

```typescript
useConnection(transport, { disconnectOnCleanup: false });
```

With this option, cleanup calls `svc.detach()` instead — removing internal handlers from the transport without closing it. The caller is then responsible for manually calling `transport.disconnect()` when the transport should actually close (e.g., returning to main menu).

## Re-connection Caveat

When `DataChannelTransport.connect()` is called on an already-open transport, it returns early but fires `peerJoinHandlers` so newly attached TransportService handlers detect the peer. Without this, the new world's `usePeers()` and `useOnPeerLeave()` would not see the existing peer.

## Related

- `demos/arena/src/main.ts` — `startOnlineGame` uses this pattern for rematch
- `demos/arena/src/nodes/ArenaNode.ts` — passes `{ disconnectOnCleanup: false }`
