import type { Scheduler } from './scheduler';
import { nowMilliseconds } from './scheduler';

/** requestAnimationFrame-based scheduler (browser). */
export class RAFScheduler implements Scheduler {
    //#region Fields

    private requestId: number | null = null;
    private running = false;
    private lastTimestamp = 0;

    //#endregion

    //#region Public Methods

    /**
     * Start the scheduler.
     * @param loop The loop function to call.
     * @param _targetStepMilliseconds The target step milliseconds; not used by this scheduler.
     */
    start(
        loop: (deltaMilliseconds: number) => void,
        _targetStepMilliseconds: number,
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
            this.requestId = requestAnimationFrame(tick);
        };

        this.requestId = requestAnimationFrame(tick);
    }

    /**
     * Stop the scheduler.
     */
    stop(): void {
        this.running = false;
        if (
            this.requestId != null &&
            typeof cancelAnimationFrame !== 'undefined'
        ) {
            cancelAnimationFrame(this.requestId);
        }
        this.requestId = null;
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
