/**
 * Scheduling abstraction so World can own its loop, but you
 * can bring your own timing if desired (e.g., tests, headless, custom clocks).
 */
export interface Scheduler {
    /**
     * Start driving the loop. Provide real-time delta in milliseconds.
     * @param loop The loop function to call.
     * @param targetStepMilliseconds The target step milliseconds.
     */
    start(
        loop: (deltaMilliseconds: number) => void,
        targetStepMilliseconds: number,
    ): void;

    /**
     * Stop driving the loop.
     */
    stop(): void;

    /**
     * Check if the scheduler is running.
     * @returns True if the scheduler is running; otherwise, false.
     */
    isRunning(): boolean;
}

/**
 * Cross-platform time helper.
 * @returns The current time in milliseconds.
 */
export function nowMilliseconds(): number {
    return typeof performance !== 'undefined' ? performance.now() : Date.now();
}
