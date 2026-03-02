---
paths:
  - "demos/arena/src/nodes/**/*"
  - "packages/network/src/**/*"
---

# Network Physics: Replicate Gameplay Events, Not Collision Detection

**Problem:** In networked multiplayer, relying on both clients to independently detect physics collisions via local simulation fails when remote player positions lag due to network latency and interpolation. The remote kinematic body's position is approximate, so the defending machine may never trigger a collision even though the attacker did.

**Solution:** Have the detecting client broadcast the gameplay effect (e.g., knockback impulse) over the network. Apply the effect on the remote player with timestamp-based deduplication to prevent double-application when both machines coincidentally detect the same collision.

## Implementation Pattern

1. **Producer (LocalPlayerNode):**
   - Detect collisions locally via `useOnCollisionStart`.
   - Compute the impulse effect (e.g., knockback direction and magnitude).
   - Publish to a named channel (e.g., `useChannel('knockback', ...)`).
   - Record the time of the local detection (`lastLocalKnockbackTime`).

2. **Consumer (LocalPlayerNode receiving replication):**
   - Subscribe to the same channel.
   - Before applying the remote effect, check if a local collision was detected recently (within `KNOCKBACK_DEDUP_WINDOW`, typically 150ms).
   - Skip the remote effect if dedup window is active; otherwise apply it.

3. **Remote representation (RemotePlayerNode):**
   - Use a kinematic body driven by `useReplicateTransform` with appropriate `lambda` for smooth interpolation.
   - Do not enable local collision detection for knockback—collisions on the remote body are ignored.
   - Remote players can still participate in other physics queries (e.g., fall detection).

## Key Constants

- `KNOCKBACK_DEDUP_WINDOW = 150` (ms): Ignore network knockback if a local collision happened within this window.
- `lambda = 25` (in RemotePlayerNode): Higher than default to reduce visual lag; balances responsiveness with stability.

## Benefits

- **Predictable:** the attacking player feels immediate feedback without waiting for the remote client's collision check.
- **Authoritative:** only the observing player can "declare" a hit; prevents disputes.
- **Resilient:** works correctly even when network latency varies.
- **DRY:** no need for complex consensus algorithms.

## See Also

- `LocalPlayerNode.ts`: collision detection and knockback publishing.
- `RemotePlayerNode.ts`: kinematic body with replicated transform.
- `InterpolationService.ts`: dead-reckoning with velocity extrapolation.
- `useReplicateTransform()`: network transform replication with configurable damping.
