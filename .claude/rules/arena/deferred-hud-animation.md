---
paths:
  - "demos/arena/src/nodes/ScoreHudNode.ts"
---
# Deferred HUD Animation After Replay

## Problem

HUD elements that hide during replay (opacity: 0) and trigger animations on state change (e.g., score pop/flash) will fire the animation invisibly if the state change happens during replay. Even with deferred score syncing (only updating displayed values when NOT in replay), the animation fires on the exact same frame the HUD becomes visible — the element transitions from opacity 0 to 1 while simultaneously animating, making the animation imperceptible.

## Solution: Delay Score Sync After Replay Exits

Track the replay→visible transition and defer the score sync by ~300ms:

```typescript
let wasInReplay = false;
let scoreRevealTime = 0;

useFrameUpdate(() => {
  const inReplay = gameState.phase === 'replay' && isReplayActive();
  el.style.opacity = inReplay ? '0' : '1';

  // Defer score sync so HUD fades in before animation fires
  if (wasInReplay && !inReplay) {
    scoreRevealTime = performance.now() + 300;
  }
  wasInReplay = inReplay;

  if (!inReplay && performance.now() >= scoreRevealTime) {
    // Safe to sync scores and trigger animations here
  }
});
```

## When This Applies

Any HUD overlay that:
1. Hides during replay via opacity
2. Triggers a visual animation (scale, flash, glow) on data change
3. Data changes occur during the hidden period (replay phase)

The animation must be deferred past the visibility transition to be perceptible.

## Why 300ms

- Typical CSS fade (opacity 0→1) takes ~200–250ms
- Deferred sync at 300ms ensures the HUD is fully opaque before the animation triggers
- Tune based on actual fade duration if different

## See Also

- `dom-animation-forced-reflow.md` — For the forced-reflow pattern needed when triggering CSS transitions directly from within `useFrameUpdate`
