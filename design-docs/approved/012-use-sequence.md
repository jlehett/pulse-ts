# Approved: Animation Sequencing (`useSequence`)

> Declarative time-based sequences of actions and delays for cutscenes, intros, transitions, and multi-step effects.

**Origin:** Engine Improvements #12 (`useSequence`).

---

## Summary

A new `useSequence` hook in `@pulse-ts/effects` that provides declarative, time-based sequencing of actions. Steps execute in order with optional leading (`pre`) and trailing (`post`) delays. Supports parallel sub-sequences for concurrent effects.

---

## Problem

The arena demo has many cases of time-sequenced effects: IntroOverlayNode fades in labels, waits 3 seconds, then fades out and transitions phase. ReplayNode shows letterboxes, plays replay, triggers effects at hit moments, then fades back. These sequences are implemented with elapsed-time counters and nested `if` chains — fragile, hard to read, and duplicated across nodes.

---

## API

```typescript
type SequenceStep =
    | { pre?: number; action?: () => void; post?: number }
    | { parallel: SequenceStep[] };

interface SequenceHandle {
    /** Start or restart the sequence from the beginning. */
    play(): void;
    /** Stop and reset to initial state. */
    reset(): void;
    /** Whether all steps have completed. */
    readonly finished: boolean;
    /** Total elapsed time since play() was called. */
    readonly elapsed: number;
}

/**
 * Declarative time-based sequence of actions and delays.
 * Each step executes as: wait `pre` → call `action` → wait `post`.
 * All three fields are optional. `parallel` steps run concurrently.
 * Advances automatically via useFrameUpdate.
 *
 * @param steps - Array of sequence steps.
 * @returns A handle for controlling playback.
 *
 * @example
 * const intro = useSequence([
 *     { action: () => applyStaggeredEntrance([vsLabel, nameLabel], 200), post: INTRO_DURATION },
 *     { action: () => { el.style.opacity = '0'; }, post: 0.4 },
 *     { action: () => { gameState.phase = 'countdown'; } },
 * ]);
 *
 * intro.play();
 */
function useSequence(steps: SequenceStep[]): SequenceHandle;
```

---

## Step Execution Model

Each step executes as a three-phase pipeline:

1. **`pre`** — Wait this many seconds before executing the action. Optional, defaults to 0.
2. **`action`** — Call this function. Optional (a step with only `pre` or `post` is a bare delay).
3. **`post`** — Wait this many seconds after the action before advancing to the next step. Optional, defaults to 0.

A `parallel` step runs multiple sub-sequences concurrently and advances when the longest one finishes.

---

## Usage Examples

### Intro overlay sequence

```typescript
const intro = useSequence([
    { action: () => applyStaggeredEntrance([vsLabel, nameLabel, taglineLabel], 200), post: INTRO_DURATION },
    { action: () => { el.style.opacity = '0'; }, post: 0.4 },
    { action: () => { gameState.phase = 'countdown'; } },
]);

// Trigger when intro phase begins
useWatch(() => gameState.phase, (phase) => {
    if (phase === 'intro') intro.play();
});
```

### Parallel effects

```typescript
const knockoutSequence = useSequence([
    { parallel: [
        { action: () => { flashOverlay.style.opacity = '1'; }, post: 0.3 },
        { action: () => triggerCameraShake(0.5, 0.3) },
        { action: () => slowMotion(0.3), post: 0.5 },
    ]},
    { action: () => { flashOverlay.style.opacity = '0'; }, post: 0.2 },
    { action: () => showKOText() },
]);
```

### Used inside a state machine's onEnter

```typescript
const sm = useStateMachine({
    initial: 'intro',
    states: {
        intro: {
            onEnter: () => intro.play(),
        },
        countdown: { /* ... */ },
    },
    transitions: [
        { from: 'intro', to: 'countdown', when: () => intro.finished },
    ],
});
```

---

## Design Decisions

- **Independent from `useStateMachine`** — Sequences and state machines are complementary. Sequences handle linear timed flows; state machines handle branching game logic. A sequence can be played from a state's `onEnter`, and a state machine can transition when a sequence finishes.
- **`pre`/`post` instead of separate delay steps** — Colocates timing with the action it belongs to. A bare delay is still possible (`{ pre: 1.0 }`) but the common case of "do X, then wait" is a single step: `{ action: fn, post: 1.0 }`.
- **Advances via `useFrameUpdate`** — Sequences are visual/presentation-layer constructs, so frame-rate timing is appropriate (vs. fixed-step).
- **`play()` restarts** — Calling `play()` on an already-playing or finished sequence resets and replays from the beginning. Use `reset()` to stop without replaying.
