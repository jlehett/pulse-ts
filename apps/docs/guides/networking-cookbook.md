# Networking Cookbook

Small, copy‑pasteable recipes for common networking tasks using `@pulse-ts/network`.

## Client: Connect via WebSocket

```ts
import { useWebSocket } from '@pulse-ts/network'

function Connect() {
  useWebSocket('ws://localhost:8080', { autoReconnect: true })
}
```

## Client: Connect P2P via WebRTC (WS signaling)

```ts
import { useWebRTC } from '@pulse-ts/network'
import { WebSocketTransport } from '@pulse-ts/network/transports/websocket'

function ConnectP2P({ selfId }: { selfId: string }) {
  const ws = () => new WebSocketTransport('ws://localhost:8080')
  useWebRTC(selfId, { signaling: ws, iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] })
}
```

## Server: Minimal WebSocket broker

```ts
import { attachWsServer } from '@pulse-ts/network'
import { WebSocketServer } from 'ws'

const server = attachWsServer(new WebSocketServer({ port: 8080 }), {
  defaultRoom: 'lobby'
})
```

## Channels: Broadcast chat

```ts
import { channel, useChannel } from '@pulse-ts/network'

const Chat = channel<{ text: string }>('chat')

function ChatAll() {
  const { publish } = useChannel(Chat, (msg) => console.log('recv', msg.text))
  // publish({ text: 'hello everyone' })
}
```

## Channels: Addressed chat

```ts
import { channel, useChannelTo } from '@pulse-ts/network'

const Chat = channel<{ text: string }>('chat')

function ChatTo({ peerId }: { peerId: string }) {
  const { publish } = useChannelTo(peerId, Chat)
  // publish({ text: 'hi!' })
}
```

## RPC: Register and call (broadcast)

```ts
import { useRPC } from '@pulse-ts/network'

function TimeProvider() {
  useRPC<void, number>('getTime', async () => Date.now())
}

function AskAnyone() {
  const { call } = useRPC<void, number>('getTime')
  // const now = await call()
}
```

## RPC: Call targeted peer

```ts
import { useRPCTo } from '@pulse-ts/network'

function AskServer() {
  const { call } = useRPCTo<void, number>('peer-server', 'getTime')
  // const now = await call()
}
```

## Reliable: Request/ack (broadcast)

```ts
import { useReliable } from '@pulse-ts/network'

function Purchases() {
  const { send } = useReliable<{ item: string }, { ok: boolean }>('shop:buy')
  // const ack = await send({ item: 'potion' }, { timeoutMs: 1500 })
}
```

## Reliable: Request/ack (targeted)

```ts
import { useReliableTo } from '@pulse-ts/network'

function PurchasesToServer() {
  const { send } = useReliableTo<{ item: string }, { ok: boolean }>('peer-server', 'shop:buy')
  // const ack = await send({ item: 'potion' })
}
```

## Replication: Transform helper

```ts
import { useReplicateTransform } from '@pulse-ts/network'

// Authority (server)
function ServerPlayer() {
  useReplicateTransform({ id: 'player-1', role: 'producer' })
}

// Consumer (client)
function ClientPlayer() {
  useReplicateTransform({ id: 'player-1', role: 'consumer', lambda: 12, snapDist: 5 })
}
```

## Status & peers (HUD)

```ts
import { useNetworkStatus, useNetworkStats, usePeers } from '@pulse-ts/network'

function HUD() {
  const status = useNetworkStatus().get()
  const stats = useNetworkStats().get()
  const peers = usePeers().list()
  // render these values
}
```

