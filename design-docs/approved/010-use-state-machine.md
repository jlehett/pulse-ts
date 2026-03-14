# Approved: State Machine Hook (`useStateMachine`)

> Declarative state machines with automatic transition evaluation, lifecycle hooks, and per-tick update callbacks.

**Origin:** Engine Improvements #10 (`useStateMachine`).

---

## Summary

A new `useStateMachine` hook in `@pulse-ts/core` that provides:

1. **Declarative state definitions** — named states with `onEnter`, `onExit`, and `onUpdate` lifecycle hooks.
2. **Automatic transitions** — guard-based transitions evaluated each fixed tick in declaration order.
3. **Imperative escape hatch** — `sm.send(state)` for explicit transitions triggered by external events.
4. **Readable game flow** — replaces 400+ line switch statements with a structured transition table.

---

## Problem

GameManagerNode is 400+ lines primarily because it hand-rolls a state machine with a switch statement over phases, manual timer management, and interleaved transition logic. The "when in state X and condition Y, transition to state Z and run effects" pattern is universal across all game types (menus, AI, cutscenes, tutorials, combat systems), yet the engine provides no built-in support for it.

---

## API

```typescript
interface StateMachineConfig<S extends string> {
    /** Initial state. */
    initial: S;
    /** State definitions with optional lifecycle hooks. */
    states: Record<S, {
        /** Called once when entering this state. */
        onEnter?: () => void;
        /** Called once when leaving this state. */
        onExit?: () => void;
        /** Called each fixed tick while in this state. */
        onUpdate?: (dt: number) => void;
    }>;
    /** Automatic transitions evaluated each fixed tick in declaration order. */
    transitions?: Array<{
        from: S | S[];
        to: S;
        when: () => boolean;
        /** Side effect to run during the transition (after onExit, before onEnter). */
        action?: () => void;
    }>;
}

interface StateMachineHandle<S extends string> {
    /** Current state name. */
    readonly current: S;
    /** Force a transition to a specific state. Fires onExit/onEnter hooks. */
    send(state: S): void;
}

/**
 * Declarative state machine that evaluates transitions each fixed tick.
 * Fires onExit/onEnter hooks on state changes. Calls onUpdate each tick
 * while in a state.
 *
 * @param config - State machine configuration.
 * @returns A handle for reading current state and forcing transitions.
 *
 * @example
 * const sm = useStateMachine({
 *     initial: 'intro',
 *     states: {
 *         intro: {},
 *         countdown: {
 *             onEnter: () => countdownTimer.reset(),
 *             onUpdate: () => {
 *                 gameState.countdownValue = computeCountdownValue(countdownTimer.remaining);
 *             },
 *         },
 *         playing: {},
 *         replay: {
 *             onEnter: () => startReplay(),
 *         },
 *         ko_flash: {
 *             onEnter: () => { koFlashTimer.reset(); koSfx.play(); },
 *         },
 *         resetting: {
 *             onEnter: () => { resetPauseTimer.reset(); clearRecording(); },
 *         },
 *         match_over: {
 *             onEnter: () => fanfareSfx.play(),
 *         },
 *     },
 *     transitions: [
 *         { from: 'playing',   to: 'replay',    when: () => gameState.pendingKnockout >= 0 },
 *         { from: 'replay',    to: 'ko_flash',  when: () => !isReplayActive() },
 *         { from: 'ko_flash',  to: 'resetting', when: () => !koFlashTimer.active },
 *         { from: 'resetting', to: 'countdown', when: () => !resetPauseTimer.active },
 *         { from: 'countdown', to: 'playing',   when: () => !countdownTimer.active },
 *     ],
 * });
 */
function useStateMachine<S extends string>(
    config: StateMachineConfig<S>,
): StateMachineHandle<S>;
```

---

## Transition Lifecycle

When a transition fires (either automatic or via `send()`):

1. Current state's `onExit()` is called (if defined).
2. Transition's `action()` is called (if defined).
3. Current state is updated to the new state.
4. New state's `onEnter()` is called (if defined).

Automatic transitions are evaluated each fixed tick in declaration order. The first matching transition fires. Only one transition fires per tick to prevent cascading.

---

## Usage Example

```typescript
import { useStateMachine } from '@pulse-ts/core';

export function GameManagerNode() {
    const gameState = useContext(GameCtx);
    const countdownTimer = useTimer(COUNTDOWN_DURATION);
    const koFlashTimer = useTimer(KO_FLASH_DURATION);
    const resetPauseTimer = useTimer(RESET_PAUSE_DURATION);

    const sm = useStateMachine({
        initial: 'intro',

        states: {
            intro: {},

            countdown: {
                onEnter: () => {
                    countdownTimer.reset();
                    gameState.countdownValue = 3;
                },
                onUpdate: () => {
                    gameState.countdownValue = computeCountdownValue(countdownTimer.remaining);
                },
            },

            playing: {},

            replay: {
                onEnter: () => startReplay(gameState.lastKnockedOut),
            },

            ko_flash: {
                onEnter: () => {
                    koFlashTimer.reset();
                    koAnnounceSfx.play();
                },
            },

            resetting: {
                onEnter: () => {
                    resetPauseTimer.reset();
                    gameState.isTie = false;
                    clearRecording();
                },
            },

            match_over: {
                onEnter: () => matchFanfareSfx.play(),
            },
        },

        transitions: [
            { from: 'playing',   to: 'replay',    when: () => gameState.pendingKnockout >= 0 },
            { from: 'replay',    to: 'ko_flash',  when: () => !isReplayActive(),
              action: () => {
                  gameState.round++;
                  applyScoring();
              },
            },
            { from: 'ko_flash',  to: 'resetting', when: () => !koFlashTimer.active },
            { from: 'resetting', to: 'countdown', when: () => !resetPauseTimer.active },
            { from: 'countdown', to: 'playing',   when: () => !countdownTimer.active },
        ],
    });

    // Imperative transition from external event (e.g., intro complete)
    // sm.send('countdown');
}
```

---

## Design Decisions

- **`onUpdate` included but optional** — For simple per-tick work (1-5 lines), colocating in the state definition is a readability win. For complex states, users can leave `onUpdate` off and use a guarded `useFixedUpdate` instead. Both patterns coexist.
- **One transition per tick** — Prevents cascading transitions within a single frame, which can cause hard-to-debug ordering issues.
- **Declaration-order evaluation** — Transitions are evaluated in the order they appear in the array. First match wins. This gives users explicit control over priority.
- **`from` accepts array** — Allows shared transitions like `{ from: ['playing', 'countdown'], to: 'paused', when: () => gameState.paused }`.
- **No event-based transitions** — The `when` guard pattern covers all use cases without introducing an event dispatch system. `sm.send()` handles imperative transitions.
