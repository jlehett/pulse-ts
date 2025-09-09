# Guide: Networking: Authoritative Server & Client Worlds

Authoritative multiplayer setups run independent Worlds on the server and on each client. Each `World` owns its own tick loop and systems; they communicate over transports using channels/RPC/replication.

## Model overview

- **Server World (authoritative)**
  - Runs simulation in fixed ticks.
  - Publishes state deltas via replication snapshots.
  - Receives player inputs/requests via channels/RPC.
  - Typically does not interpolate.

- **Client World (presentation)**
  - Sends inputs/requests to server.
  - Consumes server snapshots and renders interpolated state.
  - Typically does not send authoritative snapshots.

Both sides are built with the same Functional Nodes API and `World` class.

## Installing networking into a World

Use `installNetwork(world, options)` to add networking services/systems to any World.

```ts
import { World } from '@pulse-ts/core';
import { installNetwork } from '@pulse-ts/network';

const world = new World();
await installNetwork(world, { /* transport, replication, systems */ });
world.start();
```

### Systems added by installNetwork

- `NetworkTick` (frame.early): flushes outgoing and dispatches incoming packets.
- `SnapshotSystem` (fixed.update): schedules and sends replication snapshots.
- `InterpolationSystem` (frame.update): eases transforms toward network targets.

Enable/disable per side:

```ts
// Server: send snapshots; no interpolation
await installNetwork(serverWorld, { systems: { interpolation: false } });

// Client: interpolate; do not send snapshots
await installNetwork(clientWorld, { systems: { snapshot: false } });
```

## Choosing a transport

- **WebSocket** (real deployment): `WebSocketTransport(url)` on clients; a Node `ws` server with `NetworkServer` on the server side.
- **Memory** (local tests): `MemoryTransport(createMemoryHub())` to connect Worlds within the same process.

### WebSocket: server hosting and client connect

```ts
// Server (Node)
import { World } from '@pulse-ts/core';
import { installNetwork, NetworkServer, WebSocketTransport } from '@pulse-ts/network';
import { WebSocketServer } from 'ws';

const serverWorld = new World();
await installNetwork(serverWorld, {
  // Authoritative: no interpolation on server
  systems: { interpolation: false }
});
serverWorld.start();

// Host a broker that fans out channel packets between peers
const broker = new NetworkServer({ defaultRoom: 'match-1' });
broker.attachWebSocketServer(
  new WebSocketServer({ port: 8080 })
);

// Register server RPC or channel handlers on `broker`
broker.registerRpc('getTime', () => Date.now());
broker.registerChannel('chat', {
  onMessage: (msg, peer) => {
    // forward to everyone in sender's rooms
    // return true to consume and not auto-forward (here we use default routing)
  }
});
```

```ts
// Client (browser)
import { World } from '@pulse-ts/core';
import { installNetwork } from '@pulse-ts/network';
import { WebSocketTransport } from '@pulse-ts/network/transports/websocket';

const clientWorld = new World();
await installNetwork(clientWorld, {
  transport: () => new WebSocketTransport('ws://localhost:8080'),
  systems: { snapshot: false } // do not author snapshots on client
});
clientWorld.start();
```

### Memory: local simulation

```ts
import { World } from '@pulse-ts/core';
import { installNetwork } from '@pulse-ts/network';
import { createMemoryHub, MemoryTransport } from '@pulse-ts/network/transports/memory';

const hub = createMemoryHub();

const serverWorld = new World();
await installNetwork(serverWorld, {
  transport: () => new MemoryTransport(hub),
  systems: { interpolation: false }
});
serverWorld.start();

const clientWorld = new World();
await installNetwork(clientWorld, {
  transport: () => new MemoryTransport(hub),
  systems: { snapshot: false }
});
clientWorld.start();
```

## Replication roles and interpolation

- Server registers replicas with `read()` functions. `SnapshotSystem` diffs current state vs last sent and publishes deltas at `replication.sendHz` (default 20 Hz).
- Client registers replicas with `apply(patch)` functions and lets `InterpolationSystem` smooth presentation each frame.

Common case: transforms.

```ts
import { useFrameUpdate, useComponent, Transform } from '@pulse-ts/core';
import { useReplicateTransform } from '@pulse-ts/network/fc/transform';

// Authoritative entity (server)
function ServerPlayer() {
  const t = useComponent(Transform);
  useReplicateTransform({ id: 'player-1', role: 'producer' });
  useFrameUpdate((dt) => { t.localPosition.x += 3 * dt; });
}

// Remote entity (client)
function ClientPlayer() {
  useReplicateTransform({ id: 'player-1', role: 'consumer', lambda: 12, snapDist: 5 });
}
```

## Time and ticks

- Each `World` owns its loop (`fixed` and `frame` phases). The server’s simulation cadence drives authoritative state; clients render at their display rate and use interpolation to hide latency.
- You can manually drive time (e.g., for headless servers): `world.tick(dtMs)`.
- Tune fixed step, max catch-up steps, and frame clamp with `new World({ fixedStepMs, maxFixedStepsPerFrame, maxFrameDtMs })`.

## Tips

- Use `installNetwork(world, { replication: { sendHz } })` to trade latency vs bandwidth.
- Disable `SnapshotSystem` on clients and `InterpolationSystem` on the server.
- Use rooms in `NetworkServer` to segment matches/sessions.
- Consider clock sync (`ClockSyncService`) for RTT/offset metrics.

## See also

- Networking: Replication & Interpolation → `/guides/network-snapshots-interpolation`
- Networking: RPC & Reliable Channels → `/guides/network-rpc-channels`


