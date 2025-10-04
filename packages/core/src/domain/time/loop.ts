import type { Scheduler } from '../../infra/scheduler';
import type { UpdateKind, UpdatePhase } from '../ecs/base/types';

/**
 * Options for the loop.
 */
export interface LoopOptions {
    /**
     * The fixed step in milliseconds for the fixed step update.
     */
    fixedStepMs: number;
    /**
     * The maximum number of fixed steps per frame.
     */
    maxFixedStepsPerFrame: number;
    /**
     * The maximum delta time in milliseconds for the frame update.
     */
    maxFrameDtMs: number;
    /**
     * The scheduler to use for the loop.
     */
    scheduler: Scheduler;
}

/**
 * Hooks for the loop.
 */
export interface LoopHooks {
    /**
     * Called before the fixed step update.
     */
    beforeFixedStep?: () => void;
    /**
     * Called to run a phase of the loop.
     * @param kind The kind of update.
     * @param phase The phase of the update.
     * @param dtSeconds The delta time in seconds.
     */
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

    private paused = false;
    private timeScale = 1;

    // perf sampling (rolling window)
    private sampleAccumMs = 0;
    private framesInWindow = 0;
    private fixedInWindow = 0;
    private fps = 0;
    private sps = 0;

    constructor(opts: LoopOptions, hooks: LoopHooks) {
        this.scheduler = opts.scheduler;
        this.fixedStep = opts.fixedStepMs;
        this.maxFixedStepsPerFrame = opts.maxFixedStepsPerFrame;
        this.maxFrameDtMs = opts.maxFrameDtMs;
        this.hooks = hooks;
    }

    /**
     * Starts the loop.
     */
    start(): void {
        let last = (globalThis as any)?.performance?.now?.() ?? Date.now();
        this.scheduler.start((now) => {
            const raw = now - last;
            last = now;
            const dtMs = Math.min(Math.max(raw, 0), this.maxFrameDtMs);
            this.tick(dtMs);
        });
    }

    /**
     * Stops the loop.
     */
    stop(): void {
        this.scheduler.stop();
    }

    /**
     * Runs a tick of the loop.
     * @param dtMs The delta time in milliseconds.
     */
    tick(dtMs: number): void {
        if (this.paused) return;
        if (this.timeScale !== 1) dtMs *= this.timeScale;
        this.frameId++;
        this.accumulator += dtMs;
        this.framesInWindow++;

        // fixed steps
        let steps = 0;
        while (
            this.accumulator >= this.fixedStep &&
            steps < this.maxFixedStepsPerFrame
        ) {
            this.fixedInWindow++;
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

        // perf sampling
        this.sampleAccumMs += dtMs;
        if (this.sampleAccumMs >= 1000) {
            const secs = this.sampleAccumMs / 1000;
            this.fps = this.framesInWindow / secs;
            this.sps = this.fixedInWindow / secs;
            this.sampleAccumMs = 0;
            this.framesInWindow = 0;
            this.fixedInWindow = 0;
        }
    }

    /**
     * Gets the ambient alpha for the current tick kind.
     * @returns The ambient alpha for the current tick kind.
     */
    getAmbientAlpha(): number {
        return this.currentTickKind === 'frame' ? this.lastAlpha : 0;
    }

    /**
     * Gets the frame id.
     * @returns The frame id.
     */
    getFrameId(): number {
        return this.frameId;
    }

    /**
     * Gets the accumulator.
     * @returns The accumulator.
     */
    getAccumulator(): number {
        return this.accumulator;
    }

    /**
     * Sets the accumulator.
     * @param ms The accumulator in milliseconds.
     */
    setAccumulator(ms: number): void {
        this.accumulator = ms;
    }

    /**
     * Pauses the loop.
     */
    pause(): void {
        this.paused = true;
    }

    /**
     * Resumes the loop.
     */
    resume(): void {
        this.paused = false;
    }

    /**
     * Checks if the loop is paused.
     * @returns True if the loop is paused, false otherwise.
     */
    isPaused(): boolean {
        return this.paused;
    }

    /**
     * Sets the time scale.
     * @param scale The time scale.
     */
    setTimeScale(scale: number): void {
        this.timeScale = Math.max(0, scale);
    }

    /**
     * Gets the time scale.
     * @returns The time scale.
     */
    getTimeScale(): number {
        return this.timeScale;
    }

    /**
     * Gets the FPS.
     * @returns The FPS.
     */
    getFps(): number {
        return this.fps;
    }

    /**
     * Gets the fixed SPS.
     * @returns The fixed SPS.
     */
    getFixedSps(): number {
        return this.sps;
    }
}
