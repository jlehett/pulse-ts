---
paths:
  - "demos/arena/src/nodes/LocalPlayerNode.ts"
  - "demos/arena/src/playerVelocity.ts"
---
# Knockback: Other Player's Velocity + Bidirectional Online Sync

## Design Contract

Knockback applied to a player must be based on how fast the **OTHER** player was approaching them. If Player A runs into a stationary Player B at high speed, Player B gets knocked back a lot but Player A barely moves. This creates asymmetric, intuitive knockback.

**Never** base knockback on the player's own velocity. That would make both players receive equal knockback regardless of who was the aggressor.

## Kinematic Body Problem

In online mode, `RemotePlayerNode` uses a kinematic rigid body. Kinematic bodies report `linearVelocity = (0, 0, 0)` because their position is driven by interpolation, not physics simulation.

### Velocity Source

`RemotePlayerNode` reads **source-authoritative velocity** from the `InterpolationService` (replicated via snapshots from the producer) and writes it to the `playerVelocity` store via `setPlayerVelocity()`. This avoids deriving velocity from interpolated position deltas, which lag during sudden speed changes (dashes).

## Online Mode: Bidirectional Knockback with Dedup

Each player computes knockback locally on collision AND sends the other player's impulse via a `knockback` channel. The `impactCD` cooldown deduplicates:

- **Both detect collision:** Both apply locally (instant). Channel messages arrive but `impactCD` is active, so they're ignored.
- **Only one detects:** That player applies locally and sends. The other didn't detect, so `impactCD` is ready and the message is applied.

### Why Bidirectional (Not Host-Authoritative or Fully Independent)

Two prior approaches failed:

1. **Host-authoritative** — Host computed knockback for both players, applied its own immediately, sent the joiner's via channel. This caused **timing asymmetry**: the host got instant knockback while the joiner waited 2-3+ frames for the WebRTC message, causing visually different experiences (delayed bounce, drift toward opponent before impulse arrived).

2. **Fully independent** — Each player computed knockback locally with no channel. This failed because **independent physics engines with replicated positions can produce one-sided collision detection**. Replication lag means positions differ slightly between machines, so one physics engine may detect a collision while the other doesn't. Result: one player gets knocked back while the other stays stationary.

The bidirectional approach solves both: instant knockback when detected locally, fallback via channel when only the other side detects it.

### Dedup Mechanism

`impactCD` (0.4s cooldown) gates both the collision handler and the channel receive handler. When a collision is detected locally, `impactCD.trigger()` is called. Any channel message arriving within 0.4s is ignored because `impactCD.ready` is false. This window far exceeds WebRTC message latency (~10-50ms).

## Related

- `demos/arena/src/playerVelocity.ts` — Derived velocity store
- `demos/arena/src/nodes/RemotePlayerNode.ts` — Kinematic body, reads replicated velocity from InterpolationService
- `.claude/rules/physics/kinematic-collision-response.md` — Physics bounce halving for kinematic bodies
