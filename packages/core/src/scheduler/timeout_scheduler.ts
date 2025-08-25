import type { Scheduler } from './scheduler';
import { nowMilliseconds } from './scheduler';

/** setTimeout-based scheduler (Node or environments without RAF). */
export class TimeoutScheduler implements Scheduler {
    //#region Fields

    private timeoutId: ReturnType<typeof setTimeout> | null = null;
    private running = false;
    private lastTimestamp = 0; //#endregion

    //#region Public Methods

    /**
     * Start the scheduler.
     * @param loop The loop function to call.
     * @param targetStepMilliseconds The target step milliseconds.
     */
    start(
        loop: (deltaMilliseconds: number) => void,
        targetStepMilliseconds: number,
    ): void {
        if (this.running) return;
        this.running = true;
        this.lastTimestamp = nowMilliseconds();

        const tick = () => {
            if (!this.running) return;
            const current = nowMilliseconds();
            const delta = current - this.lastTimestamp;
            this.lastTimestamp = current;
            loop(delta);
            this.timeoutId = setTimeout(tick, targetStepMilliseconds);
        };

        this.timeoutId = setTimeout(tick, targetStepMilliseconds);
    }

    /**
     * Stop the scheduler.
     */
    stop(): void {
        this.running = false;
        if (this.timeoutId != null) clearTimeout(this.timeoutId);
        this.timeoutId = null;
    }

    /**
     * Check if the scheduler is running.
     * @returns True if the scheduler is running; otherwise, false.
     */
    isRunning(): boolean {
        return this.running;
    }

    //#endregion
}
