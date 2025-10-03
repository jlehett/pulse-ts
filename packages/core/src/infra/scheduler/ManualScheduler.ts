import type { Scheduler } from './types';

/**
 * A scheduler that uses a manual loop.
 *
 * Useful for tests; call `step(nowMs?)` to drive the loop.
 *
 * @example
 * ```ts
 * const sched = new ManualScheduler();
 * // loop = new EngineLoop({ scheduler: sched, ... }, hooks);
 * sched.step(); // drive one iteration with current time
 * ```
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
