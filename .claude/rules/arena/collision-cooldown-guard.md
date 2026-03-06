---
paths:
  - "demos/arena/src/nodes/LocalPlayerNode.ts"
---
# Collision Cooldown Guard Pattern

## Problem

Physics bounces can cause two spheres to separate and re-collide within a few frames. If a collision cooldown gates only the **sound effect**, the remaining effects fire multiple times:

- Knockback applied twice → double velocity spike
- Particles spawned twice → burst duplication
- Camera shake triggered twice → jitter
- Shockwave emitted twice → visual stutter
- `markHit()` called twice → replay sees duplicate hits

Result: **double-hit bug** — collision effects stack visibly.

## Convention

Collision cooldowns must be checked as the **first guard** in `useOnCollisionStart` handlers:

```typescript
useOnCollisionStart((other) => {
  if (!impactCD.ready) return;  // Gate entire handler

  // All effects below are protected by the cooldown
  applyKnockback(other);
  spawnParticles();
  triggerCameraShake();
  emitShockwave();
  markHit();
});
```

**Do NOT** wrap the cooldown around individual effects:

```typescript
// WRONG: other effects still fire
useOnCollisionStart((other) => {
  applyKnockback(other);
  if (impactCD.ready) {
    playSound();  // Only sound is gated
  }
  spawnParticles();  // Still spawns twice
});
```

## Why This Works

- Cooldown prevents the entire handler from re-entering during the guard duration
- All effects are atomically applied or skipped together
- Avoids physics-based re-collisions causing partial effect duplication
- Clear intent: "If cooldown is active, ignore this collision entirely"
