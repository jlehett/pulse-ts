# Guide: Networking: Replication & Interpolation

Synchronize entities across peers using snapshot/delta replication and smooth them with interpolation.

## 1) Install networking

```ts
import { World } from '@pulse-ts/core';
import { installNetwork } from '@pulse-ts/network';
import { createMemoryHub, MemoryTransport } from '@pulse-ts/network/transports/memory';

const hub = createMemoryHub();

// Peer A
const a = new World();
await installNetwork(a, { transport: () => new MemoryTransport(hub) });

// Peer B
const b = new World();
await installNetwork(b, { transport: () => new MemoryTransport(hub) });
```

## 2) Replicate an entity (hooks)

Prefer the FC hooks for cleaner replication.

### Transform replication

```ts
import { useStableId, useComponent, Transform, useFrameUpdate } from '@pulse-ts/core';
import { useReplicateTransform } from '@pulse-ts/network/fc/transform';

// Authoritative player on peer A
function AuthoritativePlayer() {
  // We need a reference to move locally
  const t = useComponent(Transform);
  // Replicate under a shared replication id across peers
  useReplicateTransform({ id: 'player', role: 'producer' });
  useFrameUpdate((dt) => { t.localPosition.x += 1 * dt; });
}

// Remote player on peer B
function RemotePlayer() {
  // Transform is auto-attached by the hook; no reference needed here
  useReplicateTransform({ id: 'player', role: 'consumer', lambda: 12, snapDist: 5 });
}
```

### Custom replica with `useReplication`

```ts
import { useStableId, useState } from '@pulse-ts/core';
import { useReplication } from '@pulse-ts/network/fc/hooks';

function Score() {
  useStableId('player');
  const [get, set] = useState('score', 0);

  // Producer: send score number; Consumer: apply patch
  useReplication<number>('score', {
    read: () => get(),
    apply: (patch) => set(() => patch ?? 0),
  });
}
```

## 3) Interpolation

`useReplicateTransform` wires the interpolation target automatically for consumers. To render, use your engine's transform reading (e.g., Three's scene graph) or query the `InterpolationService` for targets if doing custom drawing.

## Tips

- Use `installNetwork(world, { replication: { sendHz } })` to tune bandwidth vs latency.
- Use `markDirty(entityId, key)` to force a replica into the next snapshot after large jumps.
- Prefer shallow, compact replica payloads (e.g., numbers/arrays) for efficient diffs.
 - Use `useReplicateTransform` for common TRS syncing; fall back to `useReplication` for bespoke data.
