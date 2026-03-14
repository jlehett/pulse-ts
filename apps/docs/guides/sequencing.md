# Sequencing Actions

`useSequence` provides declarative, time-based sequencing of actions in `@pulse-ts/effects`. Use it for intros, cutscenes, transitions, and multi-step effects.

## Overview

A sequence is an ordered list of steps. Each step executes as:

1. **`pre`** — Wait this many seconds before the action (default 0).
2. **`action`** — Call this function (optional; omit for a bare delay).
3. **`post`** — Wait this many seconds after the action (default 0).

Call `play()` to start. The sequence advances automatically via `useFrameUpdate`.

## Quick Start

```ts
import { useSequence } from '@pulse-ts/effects';

function IntroNode() {
    const intro = useSequence([
        { action: () => showTitle(), post: 2.0 },
        { action: () => fadeOut(), post: 0.5 },
        { action: () => startGame() },
    ]);

    intro.play();
}
```

## Delays

Use `pre` and `post` to add delays around actions:

```ts
const seq = useSequence([
    // Wait 1 second, then show text, then wait 2 seconds
    { pre: 1.0, action: () => showText(), post: 2.0 },
    // Bare delay — just wait 0.5 seconds
    { post: 0.5 },
    // Immediate action
    { action: () => done() },
]);
```

## Parallel Steps

Run multiple sub-sequences concurrently with `parallel`. The parallel group advances when the longest sub-sequence finishes:

```ts
const knockoutFx = useSequence([
    {
        parallel: [
            { action: () => flash(), post: 0.3 },
            { action: () => shake(), post: 0.5 },
            { action: () => slowMotion(), post: 0.5 },
        ],
    },
    { action: () => showKOText() },
]);
```

## Playback Control

```ts
const seq = useSequence(steps);

seq.play();      // Start or restart from beginning
seq.reset();     // Stop and reset to initial state
seq.finished;    // true when all steps have completed
seq.elapsed;     // Seconds since play() was called
```

- `play()` always restarts from the beginning, even if the sequence is mid-playback.
- `reset()` stops playback without restarting.

## Composing with State Machines

Sequences and state machines are complementary. Use sequences for linear timed flows and state machines for branching logic:

```ts
import { useStateMachine } from '@pulse-ts/core';
import { useSequence } from '@pulse-ts/effects';

function GameNode() {
    const intro = useSequence([
        { action: () => showTitle(), post: 2.0 },
        { action: () => fadeOut(), post: 0.5 },
    ]);

    const sm = useStateMachine({
        initial: 'intro',
        states: {
            intro: {
                onEnter: () => intro.play(),
            },
            playing: { /* ... */ },
        },
        transitions: [
            { from: 'intro', to: 'playing', when: () => intro.finished },
        ],
    });
}
```

## Limitations

- Sequences are presentation-layer constructs and advance via frame timing, not fixed-step timing.
- There is no built-in pause/resume — use `reset()` and `play()` to restart.
- Nested `parallel` groups are supported but deeply nested structures may be hard to read; consider splitting into multiple sequences.
