# Networking Overview

This guide orients you to the networking model in Pulse and helps you decide which features to use. The goals are simplicity (few concepts), portability (works in browser/Node), and ergonomics (hooks + focused services).

`@pulse-ts/network` is transport‑agnostic. All APIs operate over a small `Transport` interface. You can choose Memory (local), WebSocket (client/server), or WebRTC (P2P mesh), or plug in your own transport.

## Core Pieces (Mental Model)

- Services (singletons on a World)
  - `TransportService`: packet bus with channels, stats, and events.
  - `RpcService`: lightweight request/response over a reserved channel.
  - `ReliableChannelService`: request/ack with retries and dedupe.
  - `ReplicationService`: periodic snapshots/deltas for entities.
  - `InterpolationService`: smooths transforms toward network targets.
- Systems (loop integration)
  - `NetworkTick` (frame.early): flush + dispatch packets.
  - `SnapshotSystem` (fixed.update): schedule/send replication.
  - `InterpolationSystem` (frame.update): smooth presentation.

These services/systems are installed via `installNetwork(world, options)`. Think: “transport + bus + features layered on channels.”

## Installing into a World

```ts
import { World } from '@pulse-ts/core'
import { installNetwork } from '@pulse-ts/network'

const world = new World()
await installNetwork(world, { /* transport?, replication?, systems? */ })
world.start()
```

Options let you provide a transport (or factory), set replication rate, and enable/disable systems per side. Server‑style worlds typically disable interpolation; client‑style worlds disable snapshot authoring.

## Channels and Reserved Channels

- User channels: any string; recommended: `defineChannel<T>('chat')` or `channel<T>('chat')`.
- Reserved (used internally): `__rpc`, `__rel`, `__rep`, `__clock`, `__room`, `__signal`.

```ts
import { channel } from '@pulse-ts/network'
const Chat = channel<{ text: string }>('chat')
```

## Addressing (Directed Messages)

Packets support an optional `to: string | string[]`. When present, only the addressed peer(s) consume the message. Addressed helpers:

- `TransportService.publishTo(name, to, data)`
- `svc.channel(name).publishTo(to, data)`
- Hooks: `useChannelTo`, `useRPCTo`, `useReliableTo`

Set your local peer id via `TransportService.setSelfId(id)` so addressed filtering applies (this is handled automatically by `useWebRTC`). Receivers without a `selfId` drop addressed packets by design.

## Testing/Imperative: Pumping the Transport

In tests or imperative setups (without a running update loop), call `pump()` to flush outgoing then dispatch incoming packets in one step:

```ts
// a publishes; b receives after both sides pump
a.publish('chat', 'hello')
a.pump();
b.pump();
```

## Hooks Snapshot

- Transports: `useWebSocket`, `useMemory`, `useWebRTC`, `useConnection`
- Channels: `useChannel`, `useChannelTo`, `defineChannel`/`channel`
- RPC: `useRPC`, `useRPCTo`
- Reliable: `useReliable`, `useReliableTo`
- Replication: `useReplication`, `useReplicateTransform`
- Status/Peers: `useNetworkStatus`, `useNetworkStats`, `usePeers`

## Choosing a Topology

- Local/prototyping: Memory transport.
- Classic client/server: WebSocket with `NetworkServer` as a broker.
- P2P: WebRTC mesh (requires signaling path; see the transports guide for a full copy/paste demo).

## Common Pitfalls

- Forgetting to set an authority for a replicated entity (two producers cause oscillations). Pick one producer; others consume.
- Not setting `selfId` while using addressed messaging. Without it, addressed packets are dropped by receivers.
