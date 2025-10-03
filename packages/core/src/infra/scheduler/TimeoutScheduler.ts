import type { Scheduler } from './types';

/**
 * A scheduler that uses setTimeout.
 */
export class TimeoutScheduler implements Scheduler {
    constructor(private fps = 60) {}

    private id: NodeJS.Timeout | null = null;

    start(loop: (now: number) => void) {
        const frameMs = 1000 / this.fps;
        const tick = () => {
            const now =
                typeof performance !== 'undefined'
                    ? performance.now()
                    : Date.now();
            // Let the world compute dt from "real" now; we don't synthesize it here
            loop(now);
            this.id = setTimeout(tick, frameMs);
        };
        this.id = setTimeout(tick, 0);
    }

    stop() {
        if (this.id != null) clearTimeout(this.id);
        this.id = null;
    }
}
