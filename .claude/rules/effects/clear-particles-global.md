---
paths:
  - "packages/effects/**/*"
  - "demos/arena/src/nodes/**/*.ts"
---
# Global Particle Clear Behavior

## Critical Constraint

`useClearParticles()` clears **ALL particles from ALL pools globally** — not just particles from the calling node. Any node invoking `clearParticles()` will wipe particles spawned by every other effect system in the application.

## Bug Pattern

Persistent particle effects (e.g., atmospheric dust) can be unintentionally cleared when an unrelated node calls `clearParticles()`:

### Example: ReplayNode × AtmosphericDustNode

- **ReplayNode** calls `clearParticles()` when entering replay mode to flush lingering gameplay particles (trail, impact)
- **AtmosphericDustNode** maintains persistent background dust via continuous emission
- **Result:** Dust disappears during replay, even though it should persist

## Mitigation: Respawn on Phase Transition

Persistent particle effects must **respawn on every relevant phase transition**, not rely on long-lived bursts:

```typescript
// In AtmosphericDustNode:
useFixedUpdate(() => {
  // Always respawn dust particles on phase changes
  // Don't assume the burst persists across global clears
  if (shouldEmitDust()) {
    burstDust(); // Fresh burst, not leftover from before
  }
});
```

## Audit When Adding Persistent Effects

Before introducing any persistent particle effect (one that should survive clears from other nodes):

1. List all callers of `clearParticles()` in the arena demo
2. Verify your effect respawns after each clear
3. Consider the lifecycle carefully: is this effect truly "persistent" (survives everything) or "phase-scoped" (limited to certain gameplay states)?

## Current Callers

- **`ReplayNode.ts`** — Clears on replay entry to remove gameplay particles
- **`AtmosphericDustNode.ts`** — Also clears on phase change (then re-bursts)

## Frame Ordering & Respawn Deferral

When multiple nodes react to the same phase transition in their `useFrameUpdate` callbacks, **execution order is not guaranteed**. A critical race condition can occur:

1. **NodeA** (e.g., `AtmosphericDustNode`) runs first and bursts new particles
2. **NodeB** (e.g., `ReplayNode`) runs after and calls `clearParticles()`, **wiping NodeA's freshly spawned particles**

This violates NodeA's intent to maintain persistent effects.

### Solution: Defer Re-burst by 2 Frames

When re-bursting particles after a phase transition, **use a countdown to defer spawn by 2 frames**:

```typescript
// In AtmosphericDustNode:
let respawnDelay = 0;

useFrameUpdate(() => {
  if (respawnDelay > 0) {
    respawnDelay--;
    return; // Skip this frame
  }

  if (phaseChanged) {
    respawnDelay = 2; // Defer burst by 2 frames
  }
});

useFixedUpdate(() => {
  if (respawnDelay === 0 && shouldEmitDust()) {
    burstDust(); // Safe to respawn now
  }
});
```

This ensures all other systems finish their phase transition cleanup (including `clearParticles()` calls) before new particles are spawned.

## Future Solution

A per-pool or per-effect-ID clear API would eliminate this cross-cutting issue, allowing selective clearing without global wipes.
