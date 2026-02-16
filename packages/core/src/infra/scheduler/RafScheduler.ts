import type { Scheduler } from './types';

/**
 * A scheduler that uses requestAnimationFrame.
 */
export class RafScheduler implements Scheduler {
    private id: number | null = null;

    start(loop: (now: number) => void) {
        const tick = (t: number) => {
            loop(t);
            this.id = requestAnimationFrame(tick);
        };
        this.id = requestAnimationFrame(tick);
    }

    stop() {
        if (this.id != null) cancelAnimationFrame(this.id);
        this.id = null;
    }
}
