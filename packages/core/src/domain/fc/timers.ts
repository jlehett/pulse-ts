import { useFixedUpdate } from './hooks';

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
 * @returns A {@link TimerHandle} for controlling and querying the timer.
 *
 * @example
 * ```ts
 * import { useTimer, useFixedUpdate } from '@pulse-ts/core';
 *
 * function DashAbility() {
 *   const dash = useTimer(0.15);
 *
 *   useFixedUpdate(() => {
 *     if (dashPressed) dash.reset();
 *     if (dash.active) {
 *       // apply dash velocity
 *     }
 *   });
 * }
 * ```
 */
export function useTimer(duration: number): TimerHandle {
    let elapsed = 0;
    let active = false;
    let paused = false;

    useFixedUpdate((dt) => {
        if (!active || paused) return;
        elapsed = Math.min(duration, elapsed + dt);
        if (elapsed >= duration) {
            active = false;
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
        },
        reset() {
            elapsed = 0;
            active = true;
            paused = false;
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
 * @returns A {@link CooldownHandle} for controlling and querying the cooldown.
 *
 * @example
 * ```ts
 * import { useCooldown, useFixedUpdate } from '@pulse-ts/core';
 *
 * function Fireball() {
 *   const cd = useCooldown(1.0);
 *
 *   useFixedUpdate(() => {
 *     if (firePressed && cd.ready) {
 *       cd.trigger();
 *       // launch fireball
 *     }
 *   });
 * }
 * ```
 */
export function useCooldown(duration: number): CooldownHandle {
    let cooldownRemaining = 0;
    let ready = true;
    let paused = false;

    useFixedUpdate((dt) => {
        if (ready || paused) return;
        cooldownRemaining = Math.max(0, cooldownRemaining - dt);
        if (cooldownRemaining <= 0) {
            ready = true;
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
