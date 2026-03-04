# Cooldown Phase Timing: Defer Triggers to 'playing' Phase

**Paths:** `demos/arena/src/nodes/LocalPlayerNode.ts`, `demos/arena/src/nodes/AiPlayerNode.ts`

## Problem

`useCooldown()` from `@pulse-ts/core` ticks down **every frame regardless of game phase** (countdown, replay, intro, playing). If a cooldown is triggered during a non-playing phase (e.g., on round reset), it begins counting down immediately and expires silently **before** the player gains control during the 'playing' phase.

Example: triggering dash cooldown on round reset → cooldown expires during countdown → player reaches 'playing' with cooldown already expired, appearing to have used a dash they never triggered.

## Solution Pattern

Defer gameplay-affecting cooldown triggers to the phase transition **into** 'playing':

```typescript
let lastPhase = gameState.phase;

useFrameUpdate(() => {
  const enteredPlaying = gameState.phase === 'playing' && lastPhase !== 'playing';
  if (enteredPlaying) {
    dashCooldown.trigger(); // Safe: cooldown now counts down during actual gameplay
  }
  lastPhase = gameState.phase;
});
```

On round reset (happens before 'playing' phase), use `cd.reset()` instead to clear cooldown state without starting the countdown:

```typescript
// On round reset event:
dashCooldown.reset(); // Clears state, does not trigger countdown
```

## Why This Works

- `trigger()` starts the countdown; deferring it to 'playing' ensures the cooldown duration aligns with actual gameplay time
- `reset()` clears the cooldown without starting a new countdown, appropriate for setup/reset actions
- Avoids silent expiration during non-playing phases where the player cannot act

## When This Applies

Any gameplay mechanic that uses `useCooldown()` and depends on the cooldown duration matching player action availability:
- Dash/movement ability cooldowns
- Attack/action ability cooldowns
- Any gated resource that should recharge **only during active gameplay**

Do NOT apply this pattern to UI-only cooldowns (e.g., HUD pop animation) that should count regardless of phase.

## Related Files

- `packages/core/src/domain/hooks/useCooldown.ts` — cooldown implementation
- `demos/arena/src/nodes/LocalPlayerNode.ts` — dash cooldown example
