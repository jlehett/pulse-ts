# Server Broker (WebSocket)

`NetworkServer` is a minimal broker for WebSocket servers. It forwards channel packets between peers in rooms, hosts RPC and Reliable handlers, adds simple rate limiting, and forwards WebRTC signaling.

## Attach a ws server

```ts
import { NetworkServer, attachWsServer } from '@pulse-ts/network'
import { WebSocketServer } from 'ws'

const server = attachWsServer(new WebSocketServer({ port: 8080 }), {
  defaultRoom: 'lobby',
  limits: { messagesPerSecond: 200, bytesPerSecond: 200_000 }
})
```

## Rooms

- Clients join/leave via reserved channel `__room`.
- Convenience: `useRoom(room)` sends join on mount and leave on unmount.

Server helpers:

```ts
server.joinRoom('peer-1', 'match-1')
server.leaveRoom('peer-1', 'match-1')
server.listRooms()
server.listPeers()
server.peersInRoom('match-1')
server.roomsForPeer('peer-1')
```

## Channel registry

```ts
server.registerChannel('chat', {
  validate: (data, peer) => typeof data?.text === 'string',
  onMessage: (msg, peer, srv) => {
    // return true to consume and prevent default forwarding
  },
  route: (msg, peer) => peer.rooms // optional override of forwarding rooms
})
```

## RPC & Reliable

```ts
server.registerRpc('getTime', () => Date.now())
server.registerReliable('shop:buy', async (req, peer) => ({ ok: true }))
```

## Signaling for WebRTC

The broker forwards `__signal` envelopes by `to` peer id. Use the `RtcSignalingClient` on the client side and `useWebRTC` to establish a mesh.

```ts
// Envelope shape: { to, from?, type: 'hello'|'offer'|'answer'|'ice', payload }
```

## Rate Limits

You can set global or per‑channel limits for messages and bytes. When a peer exceeds limits, you can drop messages (default) or disconnect.

```ts
const server = attachWsServer(new WebSocketServer({ port: 8080 }), {
  limits: {
    messagesPerSecond: 200,
    bytesPerSecond: 200_000,
    perChannel: { chat: { messagesPerSecond: 100 } },
    disconnectOnAbuse: false,
    onLimitExceeded: (peerId, info) => console.warn('rate limited', peerId, info)
  }
})
```
