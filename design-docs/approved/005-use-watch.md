# Approved: Value-Change Detection Hook (`useWatch`)

> Declarative value-change detection — run a callback when a derived value changes.

**Origin:** Engine Improvements #5 (`useWatch`).

---

## Summary

A new `useWatch` hook in `@pulse-ts/core` that tracks a derived value each tick and invokes a callback when the value changes (strict equality). Eliminates the most common closure-variable tracking pattern in the codebase.

---

## Problem

6+ arena nodes contain identical "detect when a value changes" boilerplate: store the previous value in a closure variable, compare each tick, and run a callback when different. Common patterns: round reset detection, phase transition detection, countdown value change. This is error-prone (easy to forget updating the previous value) and adds 4-5 lines of noise per usage.

---

## API

```typescript
/**
 * Watch a derived value each tick. When the value changes (strict equality),
 * invoke the callback with the new and previous values.
 * Skips the initial value (does not fire on mount).
 *
 * @param selector - A function that returns the value to watch.
 * @param callback - Called with (newValue, oldValue) when the value changes.
 * @param options - Optional: { kind: 'fixed' | 'frame' } to choose tick phase. Default: 'fixed'.
 *
 * @example
 * // Round reset detection
 * useWatch(() => gameState.round, () => {
 *     transform.localPosition.set(...spawn);
 *     body.setLinearVelocity(0, 0, 0);
 *     root.visible = true;
 * });
 *
 * @example
 * // Phase transition with previous value
 * useWatch(() => gameState.phase, (phase, prev) => {
 *     if (phase === 'playing' && prev !== 'playing') {
 *         dashCD.trigger();
 *     }
 * });
 */
function useWatch<T>(
    selector: () => T,
    callback: (value: T, prev: T) => void,
    options?: { kind?: 'fixed' | 'frame' },
): void;
```

---

## Usage Examples

### Round reset (most common use case)

```typescript
// Before — repeated in LocalPlayerNode, RemotePlayerNode, TouchControlsNode, etc.
let lastRound = gameState.round;
useFixedUpdate(() => {
    if (gameState.round !== lastRound) {
        lastRound = gameState.round;
        knockedOut = false;
        root.visible = true;
        transform.localPosition.set(...spawn);
        body.setLinearVelocity(0, 0, 0);
        dashTimer.cancel();
        dashCD.reset();
    }
});

// After
useWatch(() => gameState.round, () => {
    knockedOut = false;
    root.visible = true;
    transform.localPosition.set(...spawn);
    body.setLinearVelocity(0, 0, 0);
    dashTimer.cancel();
    dashCD.reset();
});
```

### Phase transition detection

```typescript
// Before
let lastPhase = gameState.phase;
useFixedUpdate(() => {
    if (gameState.phase === 'playing' && lastPhase !== 'playing') {
        dashCD.trigger();
    }
    lastPhase = gameState.phase;
});

// After
useWatch(() => gameState.phase, (phase, prev) => {
    if (phase === 'playing' && prev !== 'playing') {
        dashCD.trigger();
    }
});
```

### Frame-rate tick variant

```typescript
// Watch a value in the frame update loop instead of fixed update
useWatch(() => animationState.current, (state) => {
    // respond to animation state change
}, { kind: 'frame' });
```

---

## Design Decisions

- **Strict equality** — Uses `===` for comparison. For object/array watching, the selector should return a primitive derived value (e.g., `() => gameState.round` not `() => gameState`).
- **Skips initial value** — Does not fire on mount. Only fires on subsequent changes.
- **Default tick: `'fixed'`** — Most watch use cases are game-logic driven (round changes, phase transitions), which belong in the fixed update loop.

---

## Subsumes

- **#30 (`useRoundReset`)** — Round reset is the most common use case for `useWatch`. No separate hook needed.
