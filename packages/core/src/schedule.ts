/**
 * The scheduler interface.
 */
export interface Scheduler {
    start(loop: (nowMs: number) => void): void;
    stop(): void;
}

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

/**
 * A scheduler that uses setTimeout.
 */
export class TimeoutScheduler implements Scheduler {
    constructor(private fps = 60) {}

    private id: number | null = null;
    private last = 0;

    start(loop: (now: number) => void) {
        const frameMs = 1000 / this.fps;
        const tick = () => {
            const now =
                typeof performance !== 'undefined'
                    ? performance.now()
                    : Date.now();
            // Let the world compute dt from "real" now; we don't synthesize it here
            loop(now);
            this.id = setTimeout(tick, frameMs) as unknown as number;
        };
        this.id = setTimeout(tick, 0) as unknown as number;
    }

    stop() {
        if (this.id != null) clearTimeout(this.id as any);
        this.id = null;
    }
}

/**
 * A scheduler that uses a manual loop.
 */
export class ManualScheduler implements Scheduler {
    private loop: ((now: number) => void) | null = null;

    start(loop: (now: number) => void) {
        this.loop = loop;
    }

    stop() {
        this.loop = null;
    }

    step(nowMs?: number) {
        this.loop?.(nowMs ?? performance?.now?.() ?? Date.now());
    }
}
