import type { Scheduler } from './scheduler';
import { nowMilliseconds } from './scheduler';

/** requestAnimationFrame-based scheduler (browser). */
export class RAFScheduler implements Scheduler {
    private requestId: number | null = null;
    private running = false;
    private lastTimestamp = 0;

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

    isRunning(): boolean {
        return this.running;
    }
}
