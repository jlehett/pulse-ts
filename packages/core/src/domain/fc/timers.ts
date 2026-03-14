import { useFixedUpdate } from './hooks';

/**
 * Options for {@link useTimer}.
 */
export interface TimerOptions {
    /** Called once when the timer reaches its duration. */
    onComplete?: () => void;
    /** Called each fixed tick while active with `(remaining, elapsed)`. */
    onTick?: (remaining: number, elapsed: number) => void;
}

/**
 * Options for {@link useCooldown}.
 */
export interface CooldownOptions {
    /** Called once when the cooldown becomes ready. */
    onReady?: () => void;
    /** Called each fixed tick while cooling down with `(remaining, duration)`. */
    onProgress?: (remaining: number, duration: number) => void;
}

/**
 * Handle returned by {@link useTimer} for controlling a countdown timer.
 *
 * The timer starts **inactive**. Call {@link start} or {@link reset} to begin
 * counting. The timer auto-ticks via `useFixedUpdate` and deactivates when
 * `elapsed` reaches `duration`.
 */
export interface TimerHandle {
    /** Whether the timer is currently counting. */
    readonly active: boolean;
    /** Whether the timer is paused (active but not ticking). */
    readonly paused: boolean;
    /** Seconds elapsed since the timer was started (clamped to duration). */
    readonly elapsed: number;
    /** Seconds remaining (duration - elapsed). */
    readonly remaining: number;
    /** Begin counting from current elapsed value. No-op if already active. */
    start(): void;
    /** Reset elapsed to 0 and start counting. */
    reset(): void;
    /** Stop counting and reset elapsed to 0. Does not restart. */
    cancel(): void;
    /** Pause ticking without deactivating. Elapsed is preserved. */
    pause(): void;
    /** Resume ticking after a pause. No-op if not paused. */
    resume(): void;
}

/**
 * Handle returned by {@link useCooldown} for controlling a cooldown gate.
 *
 * The cooldown starts **ready**. After {@link trigger}, `ready` is `false`
 * until `duration` elapses, at which point it becomes `true` again.
 */
export interface CooldownHandle {
    /** Whether the cooldown has elapsed and can be triggered again. */
    readonly ready: boolean;
    /** Whether the cooldown is paused (cooling down but not ticking). */
    readonly paused: boolean;
    /** Seconds remaining until ready. */
    readonly remaining: number;
    /** Begin the cooldown (sets ready = false). No-op if already cooling down. */
    trigger(): void;
    /** Immediately reset to ready state. */
    reset(): void;
    /** Pause the cooldown countdown. Remaining is preserved. */
    pause(): void;
    /** Resume the cooldown countdown after a pause. No-op if not paused. */
    resume(): void;
}

/**
 * Creates a declarative countdown timer that auto-ticks via `useFixedUpdate`.
 *
 * The timer starts **inactive** — call `start()` or `reset()` to begin.
 * When `elapsed` reaches `duration`, the timer deactivates automatically.
 *
 * State is stored in closure-local variables (not `useState`) since timers
 * are runtime-only and don't need serialization.
 *
 * @param duration - The timer duration in seconds.
 * @param options - Optional callbacks for timer events.
 * @returns A {@link TimerHandle} for controlling and querying the timer.
 *
 * @example
 * ```ts
 * import { useTimer } from '@pulse-ts/core';
 *
 * // Basic usage
 * const dash = useTimer(0.15);
 *
 * // With callbacks
 * const countdown = useTimer(3.0, {
 *   onComplete: () => { gameState.phase = 'playing'; },
 *   onTick: (remaining) => { gameState.countdownValue = Math.ceil(remaining); },
 * });
 * countdown.reset(); // start the timer
 * ```
 */
export function useTimer(
    duration: number,
    options?: TimerOptions,
): TimerHandle {
    let elapsed = 0;
    let active = false;
    let paused = false;
    let completeFired = false;

    useFixedUpdate((dt) => {
        if (!active || paused) return;
        elapsed = Math.min(duration, elapsed + dt);
        const completed = elapsed >= duration;
        options?.onTick?.(duration - elapsed, elapsed);
        if (completed) {
            active = false;
            if (!completeFired) {
                completeFired = true;
                options?.onComplete?.();
            }
        }
    });

    const handle: TimerHandle = {
        get active() {
            return active;
        },
        get paused() {
            return paused;
        },
        get elapsed() {
            return elapsed;
        },
        get remaining() {
            return duration - elapsed;
        },
        start() {
            if (active) return;
            active = true;
            paused = false;
            completeFired = false;
        },
        reset() {
            elapsed = 0;
            active = true;
            paused = false;
            completeFired = false;
        },
        cancel() {
            elapsed = 0;
            active = false;
            paused = false;
        },
        pause() {
            if (!active || paused) return;
            paused = true;
        },
        resume() {
            if (!paused) return;
            paused = false;
        },
    };

    return handle;
}

/**
 * Creates a declarative cooldown gate that auto-ticks via `useFixedUpdate`.
 *
 * The cooldown starts **ready**. After `trigger()`, `ready` becomes `false`
 * until `duration` elapses, at which point it becomes `true` again.
 *
 * State is stored in closure-local variables (not `useState`) since cooldowns
 * are runtime-only and don't need serialization.
 *
 * @param duration - The cooldown duration in seconds.
 * @param options - Optional callbacks for cooldown events.
 * @returns A {@link CooldownHandle} for controlling and querying the cooldown.
 *
 * @example
 * ```ts
 * import { useCooldown } from '@pulse-ts/core';
 *
 * // Basic usage
 * const cd = useCooldown(1.0);
 *
 * // With callbacks
 * const dashCD = useCooldown(2.0, {
 *   onProgress: (remaining, duration) => {
 *     setProgress(remaining / duration);
 *   },
 *   onReady: () => { flashIndicator(); },
 * });
 * ```
 */
export function useCooldown(
    duration: number,
    options?: CooldownOptions,
): CooldownHandle {
    let cooldownRemaining = 0;
    let ready = true;
    let paused = false;

    useFixedUpdate((dt) => {
        if (ready || paused) return;
        cooldownRemaining = Math.max(0, cooldownRemaining - dt);
        options?.onProgress?.(cooldownRemaining, duration);
        if (cooldownRemaining <= 0) {
            ready = true;
            options?.onReady?.();
        }
    });

    const handle: CooldownHandle = {
        get ready() {
            return ready;
        },
        get paused() {
            return paused;
        },
        get remaining() {
            return cooldownRemaining;
        },
        trigger() {
            if (!ready) return;
            cooldownRemaining = duration;
            ready = false;
            paused = false;
        },
        reset() {
            cooldownRemaining = 0;
            ready = true;
            paused = false;
        },
        pause() {
            if (ready || paused) return;
            paused = true;
        },
        resume() {
            if (!paused) return;
            paused = false;
        },
    };

    return handle;
}
