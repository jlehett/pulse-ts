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
import { maybeGetTransform, type Transform } from './transform';
import { Ticker } from './world/ticker';
import { TypedEvent } from './event';
import { Snapshotter, type WorldSnapshot } from './world/snapshots';
import { ServiceRegistry } from './world/services';
import {
    kWorldRegisterTick,
    kWorldAddTransform,
    kWorldRemoveTransform,
    type ServiceKey,
    kWorldEmitNodeParentChanged,
} from './keys';
import { ParentChange } from './world/events';

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
    //#region Fields

    readonly nodes = new Set<Node>();

    private ticker = new Ticker();
    private parentBus = new TypedEvent<ParentChange>();
    private services = new ServiceRegistry();
    private snapshotter!: Snapshotter;

    private scheduler: Scheduler;
    private maxFixedStepsPerFrame: number;
    private maxFrameDtMs: number;

    private fixedStep = 1000 / 60;
    private accumulator = 0;

    private currentTickKind: UpdateKind | null = null; // used by interpolation
    private lastAlpha = 0;

    private idToNode = new Map<number, Node>();
    private transforms = new Set<Transform>();
    private frameId = 0;
    private systemNode: Node | null = null;

    //#endregion

    constructor(opts: WorldOptions = {}) {
        this.fixedStep = opts.fixedStepMs ?? 1000 / 60;
        this.maxFixedStepsPerFrame = opts.maxFixedStepsPerFrame ?? 8;
        this.maxFrameDtMs = opts.maxFrameDtMs ?? 250;

        this.scheduler =
            opts.scheduler ??
            (typeof window !== 'undefined' && 'requestAnimationFrame' in window
                ? new RafScheduler()
                : new TimeoutScheduler(60));

        // expose transform registry methods via symbols
        (this as any)[kWorldAddTransform] = (t: Transform) =>
            this.transforms.add(t);
        (this as any)[kWorldRemoveTransform] = (t: Transform) =>
            this.transforms.delete(t);

        this.snapshotter = new Snapshotter(this.idToNode, this.transforms);
    }

    //#region Public API

    /**
     * Subscribes to node parent change events.
     * @param fn The function to call when a node parent changes.
     * @returns A function to unsubscribe.
     */
    onNodeParentChanged(
        fn: (e: {
            node: Node;
            oldParent: Node | null;
            newParent: Node | null;
        }) => void,
    ) {
        return this.parentBus.on(fn);
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
        if (node.world === this) return node;

        node.world = this;
        this.nodes.add(node);
        this.idToNode.set(node.id, node);

        // register an existing transform (if any)
        const t = maybeGetTransform(node);
        if (t) this.transforms.add(t);

        node.onInit?.();

        // ensure children are attached as well
        for (const c of node.children) this.add(c);

        return node;
    }

    /**
     * Removes a node from the world.
     * @param node The node to remove.
     */
    remove(node: Node): void {
        if (!this.nodes.has(node)) return;
        this.nodes.delete(node);

        // unregister transform if present
        const t = maybeGetTransform(node);
        if (t) this.transforms.delete(t);

        this.idToNode.delete(node.id);
        node.world = null;
        // ticks owned by this node will be lazily unlinked during iteration
    }

    /**
     * Registers a system tick function.
     * @param kind The kind of tick.
     * @param phase The phase of the tick.
     * @param fn The tick function.
     * @param order The order of the tick.
     * @returns The tick registration.
     */
    registerSystemTick(
        kind: UpdateKind,
        phase: UpdatePhase,
        fn: TickFn,
        order = 0,
    ): { dispose(): void } {
        if (!this.systemNode) {
            this.systemNode = new Node();
            this.add(this.systemNode);
        }
        const reg = (this as any)[kWorldRegisterTick](
            this.systemNode,
            kind,
            phase,
            fn,
            order,
        ) as TickRegistration;
        return { dispose: () => reg.dispose() };
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
        this.frameId++;
        this.accumulator += dtMs;

        // fixed steps
        let steps = 0;
        while (
            this.accumulator >= this.fixedStep &&
            steps < this.maxFixedStepsPerFrame
        ) {
            // snapshot only nodes that actually have transforms
            for (const t of this.transforms) t.snapshotPrevious();

            const dt = this.fixedStep / 1000;
            this.currentTickKind = 'fixed';
            this.runPhase('fixed', 'early', dt);
            this.runPhase('fixed', 'update', dt);
            this.runPhase('fixed', 'late', dt);
            this.currentTickKind = null;

            this.accumulator -= this.fixedStep;
            steps++;
        }
        // if we hit the guard, drop leftover time to prevent spiral
        if (steps === this.maxFixedStepsPerFrame) this.accumulator = 0;

        // frame alpha
        this.lastAlpha = this.accumulator / this.fixedStep;

        // frame phases
        const dt = dtMs / 1000;
        this.currentTickKind = 'frame';
        this.runPhase('frame', 'early', dt);
        this.runPhase('frame', 'update', dt);
        this.runPhase('frame', 'late', dt);
        this.currentTickKind = null;
    }

    /**
     * Saves a snapshot of the world.
     * @returns
     */
    saveSnapshot(): WorldSnapshot {
        return this.snapshotter.save(this.accumulator);
    }

    /**
     * Restores a snapshot of the world.
     * @param snap The snapshot to restore.
     * @param opts The options for the restore.
     */
    restoreSnapshot(
        snap: WorldSnapshot,
        opts?: { strict?: boolean; resetPrevious?: boolean },
    ) {
        this.accumulator = this.snapshotter.restore(snap, opts);
    }

    /**
     * Gets the debug stats of the world.
     * @returns The debug stats.
     */
    debugStats() {
        return {
            frameId: this.frameId,
            nodes: this.nodes.size,
            transforms: this.transforms.size,
            ticks: this.ticker.stats(this.nodes),
        };
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
     * Sets a service.
     * @param key The key of the service.
     * @param service The service.
     */
    setService<T>(key: ServiceKey<T>, service: T) {
        this.services.set(key, service);
    }

    /**
     * Gets a service.
     * @param key The key of the service.
     * @returns The service.
     */
    getService<T>(key: ServiceKey<T>): T | undefined {
        return this.services.get(key);
    }

    /**
     * Gets the frame ID.
     * @returns The frame ID.
     */
    getFrameId(): number {
        return this.frameId;
    }

    //#endregion

    //#region Internal Bridge

    /**
     * Registers a tick function.
     * @param node The node to register the tick function for.
     * @param kind The kind of tick.
     * @param phase The phase of the tick.
     * @param fn The tick function.
     * @param order The order of the tick.
     * @returns The tick registration.
     */
    [kWorldRegisterTick](
        node: Node,
        kind: UpdateKind,
        phase: UpdatePhase,
        fn: TickFn,
        order = 0,
    ): TickRegistration {
        return this.ticker.register(node, kind, phase, fn, order);
    }

    /**
     * Internal; called by Node.addChild/removeChild
     * @param node The node that changed parent.
     * @param oldParent The old parent.
     * @param newParent The new parent.
     */
    [kWorldEmitNodeParentChanged](
        node: Node,
        oldParent: Node | null,
        newParent: Node | null,
    ) {
        this.parentBus.emit({ node, oldParent, newParent });
    }

    //#endregion

    //#region Private Methods

    /**
     * Runs a phase of the tick system.
     * @param kind The kind of tick.
     * @param phase The phase of the tick.
     * @param dt The delta time.
     */
    private runPhase(kind: UpdateKind, phase: UpdatePhase, dt: number) {
        this.ticker.runPhase(kind, phase, dt, this.nodes);
    }

    //#endregion
}
