# Approved: Timer Completion Callbacks

> Add `onComplete`, `onTick`, `onReady`, and `onProgress` callbacks to `useTimer` and `useCooldown`.

**Origin:** Engine Improvements #34 (Timer Completion Callbacks).

---

## Summary

Enhance the existing `useTimer` and `useCooldown` hooks in `@pulse-ts/core` with optional callback parameters. Eliminates the polling pattern where every timer usage requires a `useFixedUpdate` block checking `timer.remaining <= 0` or `cooldown.ready`.

---

## Problem

`useTimer` and `useCooldown` provide state (`active`, `elapsed`, `remaining`, `ready`) but no completion callback. Every timer usage in the arena demo polls state in `useFixedUpdate`. GameManagerNode has 4 separate timer-polling blocks. The "do X when timer expires" pattern is the primary use case, yet it requires a frame-update poll instead of a declarative callback.

---

## API

### `useTimer` enhancement

```typescript
interface TimerOptions {
    /** Called once when the timer reaches its duration. */
    onComplete?: () => void;
    /** Called each fixed tick while active. */
    onTick?: (remaining: number, elapsed: number) => void;
}

/**
 * @example
 * const countdownTimer = useTimer(COUNTDOWN_DURATION, {
 *     onComplete: () => {
 *         gameState.phase = 'playing';
 *         gameState.countdownValue = -1;
 *     },
 *     onTick: (remaining) => {
 *         gameState.countdownValue = computeCountdownValue(remaining);
 *     },
 * });
 *
 * countdownTimer.reset(); // start the timer
 */
function useTimer(duration: number, options?: TimerOptions): TimerHandle;
```

### `useCooldown` enhancement

```typescript
interface CooldownOptions {
    /** Called once when the cooldown becomes ready. */
    onReady?: () => void;
    /** Called each fixed tick while cooling down. */
    onProgress?: (remaining: number, duration: number) => void;
}

/**
 * @example
 * const dashCD = useCooldown(DASH_COOLDOWN, {
 *     onProgress: (remaining, duration) => {
 *         setDashCooldownProgress(playerId, remaining / duration);
 *     },
 *     onReady: () => {
 *         // flash HUD indicator
 *     },
 * });
 */
function useCooldown(duration: number, options?: CooldownOptions): CooldownHandle;
```

---

## Usage Examples

### Before — polling timer completion

```typescript
const countdownTimer = useTimer(COUNTDOWN_DURATION);

useFixedUpdate((dt) => {
    if (gameState.phase === 'countdown') {
        if (!countdownTimer.active) {
            countdownTimer.reset();
        }
        gameState.countdownValue = computeCountdownValue(countdownTimer.remaining);

        if (countdownTimer.remaining <= 0) {
            gameState.phase = 'playing';
            gameState.countdownValue = -1;
        }
    }
});
```

### After — declarative callbacks

```typescript
const countdownTimer = useTimer(COUNTDOWN_DURATION, {
    onComplete: () => {
        gameState.phase = 'playing';
        gameState.countdownValue = -1;
    },
    onTick: (remaining) => {
        gameState.countdownValue = computeCountdownValue(remaining);
    },
});

// Start when entering countdown phase
countdownTimer.reset();
```

### Cooldown with progress

```typescript
// Before
const dashCD = useCooldown(DASH_COOLDOWN);
useFixedUpdate(() => {
    setDashCooldownProgress(playerId, dashCD.remaining / DASH_COOLDOWN);
});

// After
const dashCD = useCooldown(DASH_COOLDOWN, {
    onProgress: (remaining, duration) => {
        setDashCooldownProgress(playerId, remaining / duration);
    },
});
```

---

## Design Decisions

- **Enhancement, not new hooks** — Optional callbacks added to existing `useTimer` and `useCooldown`. All current usages continue to work unchanged.
- **`onComplete` fires once** — Called exactly once when the timer expires, not repeatedly. Timer must be `reset()` to fire again.
- **`onTick` / `onProgress` fire each fixed tick** — Called every tick while the timer/cooldown is active. Useful for updating UI (progress bars, countdown displays) without a separate `useFixedUpdate`.
- **`onProgress` receives both `remaining` and `duration`** — Consumers can compute normalized progress (`remaining / duration`) without needing to store the duration separately.
- **Callbacks don't replace state** — `timer.active`, `timer.remaining`, `cooldown.ready` etc. are still available for cases where polling is preferred or state is read outside the callback context.
