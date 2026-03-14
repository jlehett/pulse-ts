import { useFrameUpdate } from '@pulse-ts/core';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * A single step in a sequence.
 *
 * Execution order: wait `pre` seconds → call `action` → wait `post` seconds.
 * All fields are optional — a step with only `pre` or `post` acts as a bare delay.
 *
 * Alternatively, a step can contain `parallel` to run multiple sub-sequences
 * concurrently; the parallel group advances when the longest sub-sequence finishes.
 */
export type SequenceStep =
    | { pre?: number; action?: () => void; post?: number }
    | { parallel: SequenceStep[] };

/**
 * Handle returned by {@link useSequence} for controlling playback.
 */
export interface SequenceHandle {
    /** Start or restart the sequence from the beginning. */
    play(): void;
    /** Stop and reset to initial state. */
    reset(): void;
    /** Whether all steps have completed. */
    readonly finished: boolean;
    /** Total elapsed time since `play()` was called. */
    readonly elapsed: number;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Phases within a single action step. */
type StepPhase = 'pre' | 'action' | 'post' | 'done';

interface ActionStep {
    pre: number;
    action: (() => void) | undefined;
    post: number;
}

function isParallel(step: SequenceStep): step is { parallel: SequenceStep[] } {
    return 'parallel' in step;
}

/**
 * Small tolerance to avoid floating-point comparison failures
 * when accumulating frame deltas (e.g. 5 × 0.01 vs 0.05).
 */
const EPS = 1e-9;

/** Mutable runner state for a flat (non-parallel) step. */
interface ActionRunner {
    kind: 'action';
    step: ActionStep;
    phase: StepPhase;
    phaseElapsed: number;
    done: boolean;
}

/** Mutable runner state for a parallel group. */
interface ParallelRunner {
    kind: 'parallel';
    children: SequenceRunner[];
}

type StepRunner = ActionRunner | ParallelRunner;

/** Top-level runner that walks through an array of steps. */
interface SequenceRunner {
    runners: StepRunner[];
    index: number;
    done: boolean;
}

function buildRunner(steps: SequenceStep[]): SequenceRunner {
    const runners: StepRunner[] = steps.map((step) => {
        if (isParallel(step)) {
            return {
                kind: 'parallel',
                children: step.parallel.map((sub) => buildRunner([sub])),
            } satisfies ParallelRunner;
        }
        return {
            kind: 'action',
            step: {
                pre: step.pre ?? 0,
                action: step.action,
                post: step.post ?? 0,
            },
            phase: 'pre' as StepPhase,
            phaseElapsed: 0,
            done: false,
        } satisfies ActionRunner;
    });

    return { runners, index: 0, done: steps.length === 0 };
}

function resetRunner(runner: SequenceRunner): void {
    runner.index = 0;
    runner.done = runner.runners.length === 0;
    for (const r of runner.runners) {
        if (r.kind === 'action') {
            r.phase = 'pre';
            r.phaseElapsed = 0;
            r.done = false;
        } else {
            for (const child of r.children) {
                resetRunner(child);
            }
        }
    }
}

/**
 * Advances a sequence runner by `dt` seconds.
 */
function advanceRunner(runner: SequenceRunner, dt: number): void {
    if (runner.done) return;

    let remaining = dt;
    let advanced = true;

    while (advanced && !runner.done) {
        advanced = false;
        const current = runner.runners[runner.index];
        if (!current) {
            runner.done = true;
            break;
        }

        if (current.kind === 'parallel') {
            for (const child of current.children) {
                advanceRunner(child, remaining);
            }
            const allDone = current.children.every((c) => c.done);
            if (allDone) {
                runner.index++;
                if (runner.index >= runner.runners.length) {
                    runner.done = true;
                }
                advanced = true;
            }
            remaining = 0;
        } else {
            const prevDone = current.done;
            remaining = advanceActionRunner(current, remaining);
            if (current.done) {
                if (!prevDone) {
                    runner.index++;
                    if (runner.index >= runner.runners.length) {
                        runner.done = true;
                    }
                    advanced = true;
                }
            }
        }
    }
}

/**
 * Advances a single action runner through its phases.
 * Returns unconsumed time.
 */
function advanceActionRunner(runner: ActionRunner, dt: number): number {
    let remaining = dt;

    // Pre phase
    if (runner.phase === 'pre') {
        const needed = runner.step.pre - runner.phaseElapsed;
        if (remaining >= needed - EPS) {
            remaining = Math.max(0, remaining - needed);
            runner.phase = 'action';
            runner.phaseElapsed = 0;
        } else {
            runner.phaseElapsed += remaining;
            return 0;
        }
    }

    // Action phase (instantaneous)
    if (runner.phase === 'action') {
        if (runner.step.action) {
            runner.step.action();
        }
        runner.phase = 'post';
        runner.phaseElapsed = 0;
    }

    // Post phase
    if (runner.phase === 'post') {
        const needed = runner.step.post - runner.phaseElapsed;
        if (remaining >= needed - EPS) {
            remaining = Math.max(0, remaining - needed);
            runner.phase = 'done';
            runner.done = true;
            runner.phaseElapsed = 0;
        } else {
            runner.phaseElapsed += remaining;
            return 0;
        }
    }

    return remaining;
}

// ---------------------------------------------------------------------------
// useSequence
// ---------------------------------------------------------------------------

/**
 * Declarative time-based sequence of actions and delays.
 *
 * Each step executes as: wait `pre` → call `action` → wait `post`.
 * All three fields are optional. A `parallel` step runs sub-sequences
 * concurrently and advances when the longest finishes.
 *
 * Advances automatically via `useFrameUpdate` (presentation-layer timing).
 * Call `play()` to start or restart from the beginning.
 *
 * @param steps - Array of sequence steps to execute in order.
 * @returns A {@link SequenceHandle} for controlling playback.
 *
 * @example
 * ```ts
 * import { useSequence } from '@pulse-ts/effects';
 *
 * function IntroNode() {
 *     const intro = useSequence([
 *         { action: () => showTitle(), post: 2.0 },
 *         { action: () => fadeOut(), post: 0.5 },
 *         { action: () => startGame() },
 *     ]);
 *
 *     // Start the sequence
 *     intro.play();
 * }
 * ```
 *
 * @example
 * ```ts
 * // Parallel sub-sequences
 * const fx = useSequence([
 *     { parallel: [
 *         { action: () => flash(), post: 0.3 },
 *         { action: () => shake(), post: 0.5 },
 *     ]},
 *     { action: () => showText() },
 * ]);
 * ```
 */
export function useSequence(steps: SequenceStep[]): SequenceHandle {
    let runner = buildRunner(steps);
    let playing = false;
    let elapsed = 0;

    useFrameUpdate((dt) => {
        if (!playing || runner.done) return;
        elapsed += dt;
        advanceRunner(runner, dt);
        if (runner.done) {
            playing = false;
        }
    });

    return {
        play() {
            runner = buildRunner(steps);
            elapsed = 0;
            playing = true;
        },
        reset() {
            resetRunner(runner);
            elapsed = 0;
            playing = false;
        },
        get finished() {
            return runner.done;
        },
        get elapsed() {
            return elapsed;
        },
    };
}
