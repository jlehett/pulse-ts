# Channels, RPC, Reliable

This guide explains the messaging primitives in Pulse networking — channels, RPC, and reliable request/ack — with both broadcast and addressed (peer‑specific) flows.

## Channels

```ts
import { channel, useChannel, useChannelTo } from '@pulse-ts/network'

const Chat = channel<{ text: string }>('chat')

// Subscribe and broadcast to everyone
function ChatAll() {
  const { publish } = useChannel(Chat)
  useInit(() => {
    useChannel(Chat, (msg) => console.log('recv', msg))
  })
  // publish({ text: 'hello world' })
}

// Addressed publish to a specific peer id (or ids)
function ChatToBob() {
  const { publish } = useChannelTo('peer-bob', Chat)
  // publish({ text: 'hi bob' })
}
```

Under the hood, addressed publish sets `Packet.to`; `TransportService` on receivers ignores packets addressed to other peers. Set your local id with `TransportService.setSelfId(id)` (this is done automatically in `useWebRTC`).

## RPC (Request/Response)

```ts
import { useRPC, useRPCTo } from '@pulse-ts/network'

// Register a method
function TimeProvider() {
  useRPC<void, number>('getTime', async () => Date.now())
}

// Broadcast-style call (first responder wins)
function AskAnyone() {
  const { call } = useRPC<void, number>('getTime')
  // const now = await call()
}

// Target a specific peer
function AskServer() {
  const { call } = useRPCTo<void, number>('peer-server', 'getTime')
  // const now = await call()
}
```

The RPC service includes the caller `from` id on requests so responders can unicast replies when possible.

## Reliable Request/Ack

```ts
import { useReliable, useReliableTo } from '@pulse-ts/network'

// Broadcast to anyone listening (server or peer)
function PurchaseClient() {
  const { send } = useReliable<{ item: string }, { ok: boolean }>('shop:buy')
  // const ack = await send({ item: 'potion' }, { timeoutMs: 1500 })
}

// Target a specific peer id
function PurchaseToServer() {
  const { send } = useReliableTo<{ item: string }, { ok: boolean }>('peer-server', 'shop:buy')
  // const ack = await send({ item: 'potion' })
}
```

Reliable provides correlation + retries + server‑side dedupe (in the broker). For P2P, target a specific peer to avoid multiple acks.

### Guidelines

- Broadcast when any peer may satisfy the request.
- Use `sendTo` when exactly one authority should respond (server or specific peer).
- Keep handlers idempotent — retries can deliver duplicates.
