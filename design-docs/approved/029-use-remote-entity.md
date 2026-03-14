# Approved: Network Player Convenience Hooks (`useRemoteEntity` / `useLocalEntity`)

> One-liner setup for networked replicated entities — stable ID, transform replication, and interpolation data access.

**Origin:** Engine Improvements #29 (`useRemoteEntity`).

---

## Summary

Two new convenience hooks in `@pulse-ts/network`:

1. **`useRemoteEntity`** — Sets up a consumer-side replicated entity with stable ID, transform replication, and convenient access to interpolation data (target velocity, target position).
2. **`useLocalEntity`** — Sets up a producer-side replicated entity with stable ID and transform replication.

---

## Problem

Every replicated entity requires 4-8 lines of identical network identity boilerplate: `useStableId(id)` → `useReplicateTransform({ role, lambda })` → `world.getService(InterpolationService)` → `interp.getTargetVelocity(stableId)`. The `InterpolationService` import and service lookup is especially verbose and easy to forget. Both the arena demo's `LocalPlayerNode` and `RemotePlayerNode` duplicate this setup.

---

## API

### `useRemoteEntity`

```typescript
interface RemoteEntityHandle {
    /** The stable ID used for replication. */
    readonly stableId: string;
    /** Current target velocity from the interpolation service (may be null). */
    readonly targetVelocity: { x: number; y: number; z: number } | null;
    /** Current target position from the interpolation service (may be null). */
    readonly targetPosition: { x: number; y: number; z: number } | null;
}

/**
 * Sets up a consumer-side replicated entity: assigns stable ID,
 * configures transform replication as consumer, and provides
 * convenient access to interpolation data.
 *
 * @param stableId - Unique network identity for this entity.
 * @param options - Optional configuration.
 * @returns A handle with interpolation data accessors.
 *
 * @example
 * const remote = useRemoteEntity(`player-${remotePlayerId}`, { lambda: 25 });
 *
 * useFixedUpdate(() => {
 *     const rv = remote.targetVelocity;
 *     if (rv) setPlayerVelocity(remotePlayerId, rv.x, rv.z);
 * });
 */
function useRemoteEntity(stableId: string, options?: {
    /** Interpolation smoothing factor. Higher = snappier. */
    lambda?: number;
}): RemoteEntityHandle;
```

### `useLocalEntity`

```typescript
/**
 * Sets up a producer-side replicated entity: assigns stable ID
 * and configures transform replication as producer.
 *
 * @param stableId - Unique network identity for this entity.
 *
 * @example
 * useLocalEntity(`player-${playerId}`);
 */
function useLocalEntity(stableId: string): void;
```

---

## Usage Examples

### Before

```typescript
// RemotePlayerNode.ts — 6 lines of boilerplate
const stableId = `player-${remotePlayerId}`;
useStableId(stableId);
useReplicateTransform({ role: 'consumer', lambda: 25 });

const interp = world.getService(InterpolationService);
const rv = interp?.getTargetVelocity(stableId);
if (rv) {
    setPlayerVelocity(remotePlayerId, rv.x, rv.z);
}

// LocalPlayerNode.ts — 3 lines of boilerplate
const stableId = `player-${playerId}`;
useStableId(stableId);
useReplicateTransform({ role: 'producer' });
```

### After

```typescript
// RemotePlayerNode.ts — 1 line + clean data access
const remote = useRemoteEntity(`player-${remotePlayerId}`, { lambda: 25 });

const rv = remote.targetVelocity;
if (rv) setPlayerVelocity(remotePlayerId, rv.x, rv.z);

// LocalPlayerNode.ts — 1 line
useLocalEntity(`player-${playerId}`);
```

---

## Design Decisions

- **Two separate hooks** — Producer and consumer have different return types (producer has nothing to return, consumer has interpolation data). Separate hooks make intent explicit.
- **`targetVelocity` / `targetPosition` on the handle** — Encapsulates the `InterpolationService` lookup. Consumers never need to import or query the service directly.
- **Returns `null` when unavailable** — Interpolation data may not exist yet (before first network update). Consumers check for null rather than receiving stale or zero values.
