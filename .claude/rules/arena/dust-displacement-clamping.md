---
paths:
  - "demos/arena/src/nodes/AtmosphericDustNode.ts"
---
# Atmospheric Dust Displacement Clamping

## Problem

The displacement system accumulates push forces from multiple influence sources:
- Live players (push particles away when moving through them)
- Trail entries (historical positions sampled every ~0.05s)
- Hit impacts (explosion-like particle scatter on collision)

Trail entries are sampled continuously and decay over ~0.67s, allowing **~13 entries to overlap spatially at once**. When a player spins on a particle's canonical position, all trail entries push in roughly the same direction, causing displacement to **stack unbounded**, far exceeding the intended single-influence magnitude.

## Solution: Clamp After Accumulation

After accumulating all influence forces in a loop, **clamp the total target displacement magnitude** to the maximum allowed:

```typescript
// Accumulate displacement from all sources
let targetDisplacement = new Vector3();

// ... loop: live players, trail entries, hit impacts
for (const influence of allInfluences) {
  const push = computePush(influence, particle);
  targetDisplacement.add(push);
}

// Clamp total magnitude to prevent stacking
targetDisplacement.clampLength(0, HIT_SCATTER_STRENGTH);
```

**Key:** Individual influences are correctly bounded, but spatial overlap causes summation to exceed bounds. The clamp must be applied **after** the accumulation loop, not per-influence.

## Why This Matters

- Without the clamp, spinning creates a vortex that violently ejects particles far from the intended scatter zone
- Particles accumulate at the periphery instead of settling near the platform
- Visually breaks the "dust swirling around the player" effect

## Related

- Trail entries generated in `LocalPlayerNode` and `RemotePlayerNode` at the specified sampling rate
- Hit impacts triggered during collision handling
- Ambient motion field guides particles back toward canonical positions; unbounded displacement overwhelms this recovery
