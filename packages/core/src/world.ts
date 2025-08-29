import type { FC } from './fc/runtime';
import { mountFC } from './fc/runtime';
import { Scheduler, RafScheduler, TimeoutScheduler } from './schedule';
import { Node } from './node';
import type {
    UpdateKind,
    UpdatePhase,
    TickFn,
    TickRegistration,
} from './types';
import { maybeGetTransform } from './transform';

export const __worldRegisterTick = Symbol('pulse:world:registerTick');

/**
 * Options for the World class.
 */
export interface WorldOptions {
    /**
     * The fixed step time in milliseconds.
     */
    fixedStepMs?: number;
    /**
     * The scheduler to use.
     */
    scheduler?: Scheduler;
    /**
     * The maximum number of fixed steps per frame.
     */
    maxFixedStepsPerFrame?: number;
    /**
     * The maximum frame delta time in milliseconds.
     */
    maxFrameDtMs?: number;
}

/**
 * The World class is the main class for the Pulse engine.
 * It manages the nodes and the tick system.
 */
export class World {
    readonly nodes = new Set<Node>();

    private scheduler: Scheduler;
    private maxFixedStepsPerFrame: number;
    private maxFrameDtMs: number;

    private fixedStep = 1000 / 60;
    private rafId: number | null = null;
    private lastTime = 0;
    private accumulator = 0;

    private currentTickKind: UpdateKind | null = null;
    private currentTickPhase: UpdatePhase | null = null;
    private lastAlpha = 0;

    // scheduler buckets: kind->phase->registrations[]
    private schedule: Record<
        UpdateKind,
        Record<UpdatePhase, TickRegistration[]>
    > = {
        fixed: { early: [], update: [], late: [] },
        frame: { early: [], update: [], late: [] },
    };

    // optional service map (e.g., for Three plugin)
    private services = new Map<symbol, any>();

    constructor(opts: WorldOptions = {}) {
        this.fixedStep = opts.fixedStepMs ?? 1000 / 60;
        this.maxFixedStepsPerFrame = opts.maxFixedStepsPerFrame ?? 8;
        this.maxFrameDtMs = opts.maxFrameDtMs ?? 250;

        this.scheduler =
            opts.scheduler ??
            (typeof window !== 'undefined' && 'requestAnimationFrame' in window
                ? new RafScheduler()
                : new TimeoutScheduler(60));
    }

    /**
     * Mounts a function component.
     * @param fc The function component to mount.
     * @param props The props to pass to the component.
     * @param opts The options for the mount.
     * @returns The node that was mounted.
     */
    mount<P>(fc: FC<P>, props?: P, opts?: { parent?: Node | null }): Node {
        return mountFC(this, fc, props, opts);
    }

    /**
     * Adds a node to the world.
     * @param node The node to add.
     * @returns The node.
     */
    add<T extends Node>(node: T): T {
        if (node.world && node.world !== this)
            throw new Error('Node already belongs to another World.');
        // already added to this world
        if (node.world === this) return node;
        node.world = this;
        this.nodes.add(node);
        node.onInit?.();
        for (const c of node.children) this.add(c); // ensure children get attached too
        return node;
    }

    /**
     * Removes a node from the world.
     * @param node The node to remove.
     */
    remove(node: Node): void {
        if (!this.nodes.has(node)) return;
        this.nodes.delete(node);
        node.world = null;
    }

    /**
     * Starts the world.
     */
    start(): void {
        let last = performance?.now?.() ?? Date.now();
        this.scheduler.start((now) => {
            // clamp dt to avoid death spirals after tab throttling
            const raw = now - last;
            last = now;
            const dtMs = Math.min(Math.max(raw, 0), this.maxFrameDtMs);
            this.tick(dtMs);
        });
    }

    /**
     * Stops the world.
     */
    stop(): void {
        this.scheduler.stop();
    }

    /**
     * Ticks the world.
     * @param dtMs The delta time in milliseconds.
     */
    tick(dtMs: number): void {
        this.accumulator += dtMs;

        // fixed steps
        let steps = 0;
        while (
            this.accumulator >= this.fixedStep &&
            steps < this.maxFixedStepsPerFrame
        ) {
            // snapshot previous transforms before fixed update
            for (const n of this.nodes) {
                const t = maybeGetTransform(n);
                if (t) t.snapshotPrevious();
            }
            this.runPhase('fixed', 'early', this.fixedStep / 1000);
            this.runPhase('fixed', 'update', this.fixedStep / 1000);
            this.runPhase('fixed', 'late', this.fixedStep / 1000);
            this.accumulator -= this.fixedStep;
            steps++;
        }
        // if we hit the guard, drop leftover time to prevent spiral
        if (steps === this.maxFixedStepsPerFrame) this.accumulator = 0;

        // frame alpha
        this.lastAlpha = this.accumulator / this.fixedStep;

        // frame phases
        this.runPhase('frame', 'early', dtMs / 1000);
        this.runPhase('frame', 'update', dtMs / 1000);
        this.runPhase('frame', 'late', dtMs / 1000);
    }

    /**
     * Gets the ambient alpha.
     * @returns The ambient alpha.
     */
    getAmbientAlpha(): number {
        // only during frame phases do we interpolate
        return this.currentTickKind === 'frame' ? this.lastAlpha : 0;
    }

    /**
     * Registers a tick function.
     * @param node The node to register the tick function for.
     * @param kind The kind of tick.
     * @param phase The phase of the tick.
     * @param fn The tick function.
     * @param order The order of the tick.
     * @returns The tick registration.
     */
    [__worldRegisterTick](
        node: Node,
        kind: UpdateKind,
        phase: UpdatePhase,
        fn: TickFn,
        order = 0,
    ): TickRegistration {
        const reg: TickRegistration = {
            node,
            kind,
            phase,
            order,
            fn,
            active: true,
        };
        const arr = this.schedule[kind][phase];
        // insert sorted by order (stable)
        let i = arr.findIndex((r) => r.order > order);
        if (i === -1) i = arr.length;
        arr.splice(i, 0, reg);
        return reg;
    }

    /**
     * Sets a service.
     * @param key The key of the service.
     * @param service The service.
     */
    setService<T>(key: symbol, service: T) {
        this.services.set(key, service);
    }

    /**
     * Gets a service.
     * @param key The key of the service.
     * @returns The service.
     */
    getService<T>(key: symbol): T | undefined {
        return this.services.get(key);
    }

    /**
     * Runs a phase of the tick system.
     * @param kind The kind of tick.
     * @param phase The phase of the tick.
     * @param dt The delta time.
     */
    private runPhase(kind: UpdateKind, phase: UpdatePhase, dt: number) {
        this.currentTickKind = kind;
        this.currentTickPhase = phase;
        const regs = this.schedule[kind][phase];
        // run in-place; inactive regs are skipped
        for (let i = 0; i < regs.length; i++) {
            const r = regs[i];
            if (!r.active || !this.nodes.has(r.node)) continue;
            try {
                r.fn(dt);
            } catch (e) {
                console.error(e);
            }
        }
        this.currentTickPhase = null;
        this.currentTickKind = null;
    }
}
