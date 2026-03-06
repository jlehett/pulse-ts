---
paths:
  - "demos/arena/src/nodes/LocalPlayerNode.ts"
  - "demos/arena/src/nodes/RemotePlayerNode.ts"
---
# Deferred Respawn Guard: Guard All Condition Paths

## Problem

When a boolean flag (e.g., `knockedOut`) suppresses re-entry into a code path, **ALL code paths that check the underlying condition must be guarded**, not just the primary or "safe" paths.

### The Bug Pattern

```typescript
// Mesh hidden (respawn deferred), player still below death plane
let knockedOut = false;

useFrameUpdate(() => {
  // Path A: Main death plane check (NOT guarded)
  if (transform.localPosition.y < DEATH_PLANE_Y) {
    triggerKnockout();
    knockedOut = true;
  }

  // Path B: Safety fallback (correctly guarded)
  if (knockedOut && transform.localPosition.y < SAFETY_FALLBACK_Y) {
    // This is guarded, but Path A is not
  }
});
```

During deferred respawn (mesh hidden, position not reset):
1. Player mesh is hidden but position remains below death plane
2. **Path A fires every frame** — `knockedOut` is set repeatedly
3. Each frame, `triggerKnockout()` records the knockout attempt
4. If knockout logic records player ID to a queue: queue fills with duplicates
5. **Cascading effect:** GameManagerNode sees duplicate entries and misinterprets game state (e.g., tie detection)

## Convention

Guard both the primary condition check AND all fallback paths with the same suppression flag:

```typescript
let knockedOut = false;

useFrameUpdate(() => {
  // Path A: Always guard the underlying condition check
  if (!knockedOut && transform.localPosition.y < DEATH_PLANE_Y) {
    triggerKnockout();
    knockedOut = true;
  }

  // Path B: Fallback is now redundant but still guarded for safety
  if (!knockedOut && transform.localPosition.y < SAFETY_FALLBACK_Y) {
    fallbackKnockout();
    knockedOut = true;
  }
});
```

## Why This Matters

- **Suppression flags block re-entry** — once `knockedOut = true`, the flag prevents further knockouts
- **Missing guards on secondary paths** is a subtle bug: it looks like the flag is working, but one unguarded path fires repeatedly
- **Cascading effects** — repeated state updates (recording hits, queuing knockouts) corrupt downstream logic
- **Deferred respawn amplifies the issue** — the condition remains true while the flag is set, causing the unguarded path to trigger every frame

## When This Applies

Any code pattern where:
1. A condition (y < threshold, velocity > limit, etc.) is checked repeatedly
2. A suppression flag (`knockedOut`, `hasActivated`, etc.) is set to prevent re-entry
3. Multiple code paths check **the same underlying condition**

Guard all paths, not just the ones you think matter.

## Related

- `demos/arena/src/nodes/LocalPlayerNode.ts` — death plane + safety fallback
- `collision-cooldown-guard.md` — similar atomic guarding pattern for collision effects
