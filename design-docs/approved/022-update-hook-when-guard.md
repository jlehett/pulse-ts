# Approved: `when` Guard Option for Update Hooks

> Add an optional `when` guard to `useFixedUpdate` and `useFrameUpdate` to skip execution when a condition is false.

**Origin:** Engine Improvements #22 (`usePhaseUpdate`), simplified to an option on existing hooks.

---

## Summary

Enhance `useFixedUpdate` and `useFrameUpdate` with an optional `when` guard function. When provided, the callback is only invoked when the guard returns true. Eliminates the most common boilerplate line in the codebase.

---

## Problem

Nearly every `useFixedUpdate` and `useFrameUpdate` callback in the arena demo begins with a phase guard: `if (gameState.phase !== 'playing') return;`. This appears 15+ times across 8 nodes. The guard is easy to forget, and forgetting it causes subtle bugs (movement during replay, particles during countdown, etc.).

---

## Change

```typescript
// Enhanced signature (backward-compatible — options are optional)
function useFixedUpdate(
    callback: (dt: number) => void,
    options?: { when?: () => boolean; order?: number },
): void;

function useFrameUpdate(
    callback: (dt: number) => void,
    options?: { when?: () => boolean; order?: number },
): void;
```

---

## Usage Examples

### Before — manual guard

```typescript
useFixedUpdate((dt) => {
    if (gameState.phase !== 'playing') return;
    if (gameState.paused) return;

    const { x, y } = getMove();
    body.applyImpulse(x * MOVE_IMPULSE, 0, -y * MOVE_IMPULSE);
});
```

### After — declarative guard

```typescript
useFixedUpdate((dt) => {
    const { x, y } = getMove();
    body.applyImpulse(x * MOVE_IMPULSE, 0, -y * MOVE_IMPULSE);
}, { when: () => gameState.phase === 'playing' && !gameState.paused });
```

### Multiple phases

```typescript
useFrameUpdate((dt) => {
    // camera logic...
}, { when: () => ['playing', 'countdown'].includes(gameState.phase) });
```

### No guard — unchanged

```typescript
// Still works exactly as before
useFixedUpdate((dt) => {
    // always runs
});
```

---

## Design Decisions

- **Option on existing hooks, not a new hook** — No new API to learn. Users don't have to choose between `useFixedUpdate` and `usePhaseUpdate`. The `when` option is discoverable via the existing API.
- **Backward compatible** — The options parameter is optional. All existing usages continue to work unchanged.
- **Guard evaluated each tick** — Zero overhead when the guard returns false (callback is not invoked, no closure allocation).
- **Named `when`, not `guard` or `if`** — Reads naturally: "use fixed update *when* phase is playing."
