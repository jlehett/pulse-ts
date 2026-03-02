---
paths:
  - "demos/arena/src/nodes/LocalPlayerNode.ts"
  - "demos/arena/src/nodes/GameManagerNode.ts"
  - "demos/arena/src/nodes/ArenaNode.ts"
  - "demos/arena/src/replay.ts"
  - "demos/arena/src/config/channels.ts"
---

# Online Mode Synchronization Conventions

Two critical conventions discovered during online-mode bug fixes in Arena demo. These patterns ensure both players see consistent gameplay outcomes despite network latency and independent timer-based state machines.

## Convention 1: Collision Side-Effects via Knockback Channel

**Problem:** Physics collisions are detected asymmetrically. Only the machine where the local player's body intersects the remote player's kinematic body detects the collision. The remote machine may not detect it due to network position lag.

**Convention:** Any side-effect that must happen on BOTH machines (e.g., `markHit()` for replay recording) must trigger in TWO places:

1. **Local collision callback** (`useOnCollisionStart` in LocalPlayerNode)
   - Detects the hit immediately
   - Calls `markHit()` to record in local replay buffer

2. **Knockback channel handler** (consumer receiving the replication message)
   - Receives the knockback impulse event from the attacking machine
   - Also calls `markHit()` on the receiving machine

This ensures replay recording is synchronized across both machines, even though collision detection only fires locally on the attacker's side.

### Key Files

- `demos/arena/src/nodes/LocalPlayerNode.ts` — collision detection + knockback channel publish
- `demos/arena/src/replay.ts` — `markHit()` called in two contexts (local collision + channel handler)
- `demos/arena/src/config/channels.ts` — knockback channel definition

### Implication

The knockback channel is the **synchronization point** for collision effects in online mode. If you add a new collision side-effect, route it through the knockback channel so the receiving machine can execute it too.

---

## Convention 2: Gameplay-Critical Phase Transitions Need Host Authority

**Problem:** Each machine independently runs through the phase chain (replay → ko_flash → resetting → countdown → playing) with local timers. Network latency in knockout detection and frame rate differences during replay cause timing divergence that accumulates through the chain. Without authority, both players may enter "playing" at different server times, creating desync in timed game logic.

**Convention:** For any phase transition where both players must act simultaneously (e.g., countdown→playing), use host-authoritative synchronization. The host machine broadcasts the transition signal via a dedicated channel; remote players apply it on receipt rather than relying on local timers.

Current implementation: `RoundResetChannel` carries the host's countdown completion signal. Both players transition to "playing" phase upon receiving this broadcast, not on local timer expiry.

### Key Files

- `demos/arena/src/nodes/GameManagerNode.ts` — phase state machine; host broadcasts `RoundResetChannel` to signal countdown completion
- `demos/arena/src/nodes/ArenaNode.ts` — passes `isHost` flag to GameManagerNode so it knows whether to broadcast
- `demos/arena/src/config/channels.ts` — `RoundResetChannel` definition

### Implication

When adding future phase transitions that require both players to synchronize:

1. Identify the transition that must be simultaneous (e.g., "end of replay" → "start of ko_flash")
2. Determine which machine has authority (typically the host or the player who triggered the condition)
3. Have the authoritative machine broadcast the signal; remote machines apply it on receipt
4. Do NOT rely on local timer-based detection for the transition

This pattern prevents timing drift from accumulating through the phase chain and keeps both players in sync for timed game events.

---

## Related Rules

- [Network Physics: Replicate Gameplay Events, Not Collision Detection](./network-physics.md) — detailed knockback dedup pattern
- [Replay Mark Hit Timing Constraint](./replay-mark-hit-timing.md) — timing of `markHit()` within a single machine's frame commit cycle
