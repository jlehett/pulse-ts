/**
 * Scheduling abstraction so World can own its loop, but you
 * can bring your own timing if desired (e.g., tests, headless, custom clocks).
 */
export interface Scheduler {
    /** Start driving the loop. Provide real-time delta in milliseconds. */
    start(
        loop: (deltaMilliseconds: number) => void,
        targetStepMilliseconds: number,
    ): void;
    /** Stop driving the loop. */
    stop(): void;
    /** Whether the scheduler is currently running. */
    isRunning(): boolean;
}

/** Cross-platform time helper. */
export function nowMilliseconds(): number {
    return typeof performance !== 'undefined' ? performance.now() : Date.now();
}
