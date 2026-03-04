# Module-Level State Persistence Across Game Sessions

**Paths:** `demos/arena/src/replay.ts`, `demos/arena/src/dashCooldown.ts`, `demos/arena/src/ai/playerPositions.ts`, `demos/arena/src/hitImpact.ts`, `demos/arena/src/nodes/GameManagerNode.ts`

## Critical Issue

The arena demo uses module-level singleton state (shared stores) for gameplay logic:

- **`replay.ts`** — frame buffer, writeCount, hitWriteCounts, staged positions, playback state
- **`dashCooldown.ts`** — per-player cooldown timers
- **`playerPositions.ts`** — player position snapshots for AI behavior
- **`hitImpact.ts`** — hit impact effect state

This state **persists across game sessions** because `world.destroy()` only tears down the ECS world (nodes, systems, components) — it does NOT reset module-scope variables in imported modules.

## The Bug Pattern

When a match ends and a new game starts:

1. `world.destroy()` is called, cleaning up all nodes
2. Stale module-level state from the previous match remains in memory
3. On game start, if `GameManagerNode` is recreated without resetting the shared store, the old data contaminates the new session

**Example:** Replay buffer from match A holds 1000 frames. Match B starts fresh, but the buffer still contains frames from A. When `startReplay()` is called in match B with a short round (100 frames), playback mixes old and new footage.

## The Solution

**Every module-level singleton state must be explicitly cleared when a new game session starts.** The canonical reset point is `GameManagerNode`'s function body (runs once per game mount):

```typescript
// In GameManagerNode.ts, at the top of the function:
export function GameManagerNode(props: GameManagerNodeProps): Entity {
  // Reset all module-level state
  clearRecording();
  clearDashCooldowns();
  clearPlayerPositions();
  clearHitImpactState();

  // ... rest of node initialization
}
```

Each module must export a reset/clear function that zeroes all shared state:

```typescript
// In replay.ts
export function clearRecording(): void {
  writeCount = 0;
  hitWriteCounts.clear();
  frameBuffer.length = 0;
  stagedPositions.length = 0;
  playbackState = 'idle';
  // ... reset all other module state
}
```

## Why This Matters

- `world.destroy()` is not a full application reset — it manages only ECS lifecycle
- Module-level stores are **outside the ECS** and survive world teardown
- Each new world instance (game session) starts with stale data if not manually reset
- The bug is silent: no console errors, but gameplay data corrupts unpredictably

## Checklist for New Module-Level Stores

When adding a new shared store to the arena demo:

1. Encapsulate it in a module (file) with clear exports
2. Export a reset function (e.g., `clear*()`, `reset*()`)
3. Call that reset from `GameManagerNode` on initialization
4. Document the reset requirement in JSDoc

## Related Files

- `demos/arena/src/nodes/GameManagerNode.ts` — Central reset point
- `demos/arena/src/main.ts` — Entry point; `world.destroy()` called on game end

## Anti-Pattern

Do NOT rely on module re-import or dynamic require to reset state — modules are cached by the bundler and re-import does nothing.
