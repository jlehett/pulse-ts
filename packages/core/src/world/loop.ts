import type { Scheduler } from '../schedule';
import type { UpdateKind, UpdatePhase } from '../types';

export interface LoopOptions {
    fixedStepMs: number;
    maxFixedStepsPerFrame: number;
    maxFrameDtMs: number;
    scheduler: Scheduler;
}

export interface LoopHooks {
    beforeFixedStep?: () => void;
    runPhase: (kind: UpdateKind, phase: UpdatePhase, dtSeconds: number) => void;
}

/**
 * EngineLoop isolates time accumulation, fixed/frame stepping, and scheduling.
 * World delegates start/stop/tick and frame/alpha queries through this class.
 */
export class EngineLoop {
    private scheduler: Scheduler;
    private fixedStep: number; // ms
    private maxFixedStepsPerFrame: number;
    private maxFrameDtMs: number;

    private hooks: LoopHooks;

    private accumulator = 0; // ms
    private frameId = 0;
    private currentTickKind: UpdateKind | null = null;
    private lastAlpha = 0;

    constructor(opts: LoopOptions, hooks: LoopHooks) {
        this.scheduler = opts.scheduler;
        this.fixedStep = opts.fixedStepMs;
        this.maxFixedStepsPerFrame = opts.maxFixedStepsPerFrame;
        this.maxFrameDtMs = opts.maxFrameDtMs;
        this.hooks = hooks;
    }

    start(): void {
        let last = (globalThis as any)?.performance?.now?.() ?? Date.now();
        this.scheduler.start((now) => {
            const raw = now - last;
            last = now;
            const dtMs = Math.min(Math.max(raw, 0), this.maxFrameDtMs);
            this.tick(dtMs);
        });
    }

    stop(): void {
        this.scheduler.stop();
    }

    tick(dtMs: number): void {
        this.frameId++;
        this.accumulator += dtMs;

        // fixed steps
        let steps = 0;
        while (
            this.accumulator >= this.fixedStep &&
            steps < this.maxFixedStepsPerFrame
        ) {
            this.hooks.beforeFixedStep?.();

            const dt = this.fixedStep / 1000;
            this.currentTickKind = 'fixed';
            this.hooks.runPhase('fixed', 'early', dt);
            this.hooks.runPhase('fixed', 'update', dt);
            this.hooks.runPhase('fixed', 'late', dt);
            this.currentTickKind = null;

            this.accumulator -= this.fixedStep;
            steps++;
        }
        if (steps === this.maxFixedStepsPerFrame) this.accumulator = 0;

        // frame alpha (0..1 fraction of fixed step)
        this.lastAlpha = this.accumulator / this.fixedStep;

        // frame phases
        const dt = dtMs / 1000;
        this.currentTickKind = 'frame';
        this.hooks.runPhase('frame', 'early', dt);
        this.hooks.runPhase('frame', 'update', dt);
        this.hooks.runPhase('frame', 'late', dt);
        this.currentTickKind = null;
    }

    getAmbientAlpha(): number {
        return this.currentTickKind === 'frame' ? this.lastAlpha : 0;
    }

    getFrameId(): number {
        return this.frameId;
    }

    getAccumulator(): number {
        return this.accumulator;
    }

    setAccumulator(ms: number): void {
        this.accumulator = ms;
    }
}
