/**
 * The scheduler interface.
 */
export interface Scheduler {
    start(loop: (nowMs: number) => void): void;
    stop(): void;
}
