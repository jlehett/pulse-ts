# Transports: Memory, WebSocket, WebRTC

Networking works with any transport implementing the `Transport` interface. This guide walks through each built‑in transport with step‑by‑step examples and a full P2P demo.

## Memory (Local Testing)

```ts
import { World } from '@pulse-ts/core'
import { installNetwork, createMemoryHub, useMemory } from '@pulse-ts/network'

const hub = createMemoryHub()

function ConnectA() { useMemory(hub) }
function ConnectB() { useMemory(hub) }

const worldA = new World(); await installNetwork(worldA); worldA.mount(ConnectA)
const worldB = new World(); await installNetwork(worldB); worldB.mount(ConnectB)
```

## WebSocket (Client/Server)

Client:

```ts
import { useWebSocket } from '@pulse-ts/network'

function Connect() { useWebSocket('ws://localhost:8080', { autoReconnect: true }) }
```

Server broker (Node):

```ts
import { NetworkServer, attachWsServer } from '@pulse-ts/network'
import { WebSocketServer } from 'ws'

const server = attachWsServer(new WebSocketServer({ port: 8080 }), { defaultRoom: 'lobby' })

// Optional: channel/rpc/reliable handlers
server.registerRpc('getTime', () => Date.now())
server.registerReliable('shop:buy', async (req) => ({ ok: true }))
```

Rooms are controlled via the reserved `__room` channel; the `useRoom(room)` hook sends join/leave.

## WebRTC (P2P Mesh)

WebRTC enables peer‑to‑peer meshes with a signaling path. The signaling runs over any transport (e.g., WebSocket). The `useWebRTC` hook sets up a dedicated signaling transport and swaps the main transport to WebRTC.

```ts
import { useWebRTC } from '@pulse-ts/network'
import { WebSocketTransport } from '@pulse-ts/network/transports/websocket'

// Use WebSocket for signaling to the broker, then switch to WebRTC for data
function ConnectP2P() {
  const ws = () => new WebSocketTransport('ws://localhost:8080')
  useWebRTC('peer-123', {
    signaling: ws,
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  })
}
```

**Important:** `TransportService.getStatus()` becomes `open` when signaling is wired, not when a DataChannel to a specific peer is ready. Use the peer lifecycle to gate your P2P sends:

- `usePeers()` to know when a peer id appears (fires on DataChannel open).
- Optionally send a small hello on a user channel after peer join.

Notes:

- The broker forwards `__signal` envelopes by `to` peer id; no persistence required.
- The included `WebRtcMeshTransport` negotiates DataChannels (offer/answer/ICE) and broadcasts messages to connected peers. It emits `meta.from` for per‑peer origin.
- The transport is functional but minimal; you can bring your own TURN or add “perfect negotiation” if needed.

## Status and Peers

```ts
import { useNetworkStatus, usePeers } from '@pulse-ts/network'

function HUD() {
  const status = useNetworkStatus().get()
  const peers = usePeers().list()
  // render status and peer list
}
```

P2P readiness:

- Transport status 'open' != DataChannel ready. Wait until `usePeers().has(peerId)` before sending addressed messages to that peer.

## End‑to‑End P2P Demo (Copy/Paste)

This demo sets up a WebSocket broker for signaling, then two browser peers that connect via WebRTC and exchange messages and RPC.

Server (Node):

```ts
// server.ts
import { attachWsServer, NetworkServer } from '@pulse-ts/network'
import { WebSocketServer } from 'ws'

// Start broker (routes __signal by 'to', exposes rooms and handlers)
const server = attachWsServer(new WebSocketServer({ port: 8080 }), {
  defaultRoom: 'lobby'
})

// (Optional) server handlers (RPC/reliable)
server.registerRpc('getTime', () => Date.now())
server.registerReliable('ping', async (req) => ({ ok: true }))

console.log('Broker listening on ws://localhost:8080')
```

Client (browser):

```ts
import { World } from '@pulse-ts/core'
import { mount, useInit } from '@pulse-ts/core'
import {
  installNetwork,
  useWebRTC,
  useChannel,
  useChannelTo,
  channel,
  useRPC,
  useRPCTo,
  usePeers
} from '@pulse-ts/network'
import { WebSocketTransport } from '@pulse-ts/network/transports/websocket'

const Chat = channel<{ text: string }>('chat')

function App({ selfId, peerId }: { selfId: string; peerId: string }) {
  // 1) Establish WebRTC mesh using WS signaling
  const ws = () => new WebSocketTransport('ws://localhost:8080')
  useWebRTC(selfId, { signaling: ws, iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] })

  // 2) Channels
  useChannel(Chat, (msg, meta) => console.log('chat recv from', meta.from, msg))
  const chatTo = useChannelTo(peerId, Chat)

  // 3) Targeted RPC (if a server peer exposes it); otherwise use your own peer RPC
  const rpcTo = useRPCTo<void, number>(peerId, 'getTime')

  // Track peers for readiness
  const peers = usePeers()

  useInit(async () => {
    // Gate until the peer DataChannel is ready
    const waitForPeer = () => new Promise<void>((resolve) => {
      const tryCheck = () => {
        if (peers.has(peerId)) resolve()
        else setTimeout(tryCheck, 150)
      }
      tryCheck()
    })

    await waitForPeer()
    console.log('P2P ready with', peerId)

    // Now it is safe to send addressed chat and targeted RPC
    chatTo.publish({ text: `hello from ${selfId}` })
    try {
      const now = await rpcTo.call()
      console.log('peer time:', now)
    } catch {
      console.log('rpc not available on peer (expected if no handler)')
    }
  })
}

async function main() {
  const selfId = prompt('Enter your peer id (e.g., alice)') || 'alice'
  const peerId = prompt('Enter peer to message (e.g., bob)') || 'bob'

  const world = new World()
  await installNetwork(world)
  world.mount(App, { selfId, peerId })
  world.start()
}

main()
```

Troubleshooting:

- Ensure both browser peers connect to the same broker and use different `selfId` values.
- If you’re behind NAT, add TURN servers in `iceServers`.
- Verify signaling traffic flows; check that `useWebRTC`’s signaling transport (WebSocket) connects before waiting for P2P data.
