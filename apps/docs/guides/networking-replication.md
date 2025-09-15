# Replication & Interpolation

Replication is transport‑agnostic and works over WebSocket, Memory, or WebRTC. This guide clarifies roles, cadence, how interpolation hides latency for transforms, and how to replicate arbitrary state (health, animation flags, gameplay data, etc.).

## Concepts

- Each entity needs a stable id (e.g., `useStableId('player-1')`).
- A replica is a named state slice (e.g., `'transform'`).
- Producers provide `read()`; consumers provide `apply(patch)`.
- `SnapshotSystem` diffs and sends shallow deltas at `sendHz` (default 20Hz).
- `InterpolationService` smooths presentation each frame (transforms).

## Setup

```ts
import { installNetwork } from '@pulse-ts/network'

await installNetwork(serverWorld, { systems: { interpolation: false } })
await installNetwork(clientWorld, { systems: { snapshot: false } })
```

## Transform helper

```ts
import { useReplicateTransform } from '@pulse-ts/network'

// Server/authority
function ServerPlayer() {
  useReplicateTransform({ id: 'player-1', role: 'producer' })
}

// Client/consumer
function ClientPlayer() {
  useReplicateTransform({ id: 'player-1', role: 'consumer', lambda: 12, snapDist: 5 })
}
```

## P2P notes

- Choose a single authority per entity/replica — the authority provides `read()`, others `apply()`.
- With WebRTC mesh, packets include `meta.from`, but replication itself is broadcast. In large meshes, consider addressed snapshots to reduce bandwidth (`publishTo`) or a star topology.
- Use `markDirty()` on rare updates to force inclusion in the next snapshot.
- Tune `replication.sendHz` to balance bandwidth vs latency.

## Replicating Arbitrary State (non‑Transform)

The generic `useReplication` hook lets you define any replica key (e.g., `'state'`, `'anim'`, `'stats'`) with custom `read()` and `apply(patch)` functions.

Authoritative producer example (server):

```ts
import { useInit, useState, useStableId } from '@pulse-ts/core'
import { useReplication } from '@pulse-ts/network'

type PlayerState = { hp: number; alive: boolean; stance: 'idle'|'run'|'crouch' }

function ServerPlayer() {
  useStableId('player-1')
  const [get, set] = useState<PlayerState>('p:state', { hp: 100, alive: true, stance: 'idle' })

  // Authoritative replica producer
  const { markDirty } = useReplication<PlayerState>('state', {
    read: () => get(),
  })

  // Mutations
  useInit(() => {
    // Take damage and force next snapshot to include new value immediately
    set(s => ({ ...s, hp: 80 }));
    markDirty()
  })
}
```

Consumer example (client):

```ts
import { useState, useStableId } from '@pulse-ts/core'
import { useReplication } from '@pulse-ts/network'

type PlayerState = { hp: number; alive: boolean; stance: 'idle'|'run'|'crouch' }

function ClientPlayer() {
  useStableId('player-1')
  const [get, set] = useState<PlayerState>('p:state', { hp: 100, alive: true, stance: 'idle' })

  useReplication<PlayerState>('state', {
    // Consumer applies shallow patch — only changed keys arrive
    apply: (patch) => set(s => ({ ...s, ...patch }))
  })
}
```

Notes:

- Deltas are shallow by default (`shallowDelta`). If you have nested data, either flatten it into top‑level keys or compute a shallow object containing only the changed leafs in `read()`.
- Arrays are treated as a whole value; to minimize bandwidth for large dynamic sets, consider keying by id into an object (e.g., `{ items: Record<ItemId, ItemData> }`) so shallow changes only include modified entries.

## Smoothing Non‑Transform Values

`InterpolationService` targets transforms. For other values (e.g., a scalar speed, a UI gauge), use a small local smoother on the consumer side.

Example: smooth a numeric value with an exponential moving average (EMA):

```ts
import { useFrameUpdate, useState } from '@pulse-ts/core'
import { useReplication } from '@pulse-ts/network'

type Stats = { speed: number }

function ClientStats() {
  const [getTarget, setTarget] = useState<Stats>('net:target', { speed: 0 })
  const [getDisplay, setDisplay] = useState<Stats>('net:display', { speed: 0 })

  // Replicated target from the network
  useReplication<Stats>('stats', { apply: (patch) => setTarget(s => ({ ...s, ...patch })) })

  // Smooth display toward target each frame
  useFrameUpdate((dt) => {
    const λ = 10; // higher is snappier
    const rate = 1 - Math.exp(-λ * dt)
    const t = getTarget().speed
    const c = getDisplay().speed
    const next = c + (t - c) * rate
    if (Math.abs(next - c) > 1e-4) setDisplay({ speed: next })
  })
}
```

## End‑to‑End State Example

Replicate an animation state machine flag alongside transforms.

Producer (server):

```ts
type AnimState = { stance: 'idle'|'run'|'crouch'; weaponUp: boolean }

function ServerNPC() {
  useStableId('npc-7')
  const [getAnim, setAnim] = useState<AnimState>('anim', { stance: 'idle', weaponUp: false })

  useReplication<AnimState>('anim', { read: () => getAnim() })

  // ... server AI sets stance, then mark dirty on transitions
}
```

Consumer (client):

```ts
function ClientNPC() {
  useStableId('npc-7')
  const [getAnim, setAnim] = useState<AnimState>('anim', { stance: 'idle', weaponUp: false })
  useReplication<AnimState>('anim', { apply: (p) => setAnim(s => ({ ...s, ...p })) })

  // Drive animation system from getAnim()
}
```

## Best Practices & Patterns

- Prefer shallow, flat shapes for replicas; compute summaries in `read()` to avoid noisy diffs.
- Separate concerns: transforms via `useReplicateTransform`; other state via `useReplication('state', ...)`.
- Force‑include rare state changes with `markDirty()`.
- For prediction/reconciliation, keep an “authoritative” replica and a local predicted copy, then nudge the local copy toward the authoritative patch.
- In P2P meshes, explicitly choose an authority per entity to prevent contention; or target a specific peer with addressed messaging for control paths.
