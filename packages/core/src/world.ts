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
import { Snapshotter, type WorldSnapshot } from './world/snapshots';
import { ServiceRegistry } from './world/services';
import { EngineLoop } from './world/loop';
import {
    kWorldAddTransform,
    kWorldRemoveTransform,
    type ServiceKey,
    kWorldAddBounds,
    kRegisteredTicks,
} from './keys';
import { SceneGraph } from './world/sceneGraph';
import { Bounds } from './bounds';
import { CullingSystem } from './world/culling';

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
    private scene = new SceneGraph();
    private services = new ServiceRegistry();
    private snapshotter!: Snapshotter;

    private idToNode = new Map<number, Node>();
    private transforms = new Set<Transform>();
    private bounds = new Set<Bounds>();
    private loop!: EngineLoop;
    private systemNode: Node | null = null;

    //#endregion

    constructor(opts: WorldOptions = {}) {
        const fixedStep = opts.fixedStepMs ?? 1000 / 60;
        const maxFixedStepsPerFrame = opts.maxFixedStepsPerFrame ?? 8;
        const maxFrameDtMs = opts.maxFrameDtMs ?? 250;

        const scheduler: Scheduler =
            opts.scheduler ??
            (typeof window !== 'undefined' && 'requestAnimationFrame' in window
                ? new RafScheduler()
                : new TimeoutScheduler(60));

        // expose transform registry methods via symbols
        (this as any)[kWorldAddTransform] = (t: Transform) =>
            this.registerTransform(t);
        (this as any)[kWorldRemoveTransform] = (t: Transform) =>
            this.unregisterTransform(t);
        (this as any)[kWorldAddBounds] = (b: Bounds) => this.registerBounds(b);

        this.snapshotter = new Snapshotter(this.idToNode, this.transforms);

        // decoupled time/tick loop
        this.loop = new EngineLoop(
            {
                scheduler,
                fixedStepMs: fixedStep,
                maxFixedStepsPerFrame,
                maxFrameDtMs,
            },
            {
                beforeFixedStep: () => {
                    // snapshot only nodes that actually have transforms
                    for (const t of this.transforms) t.snapshotPrevious();
                },
                runPhase: (kind, phase, dt) => this.runPhase(kind, phase, dt),
            },
        );
        new CullingSystem(this);
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
        return this.scene.onParentChanged(fn as any);
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
     * Reparents a child under a new parent (or detaches when null).
     */
    reparent(child: Node, newParent: Node | null): void {
        this.scene.reparent(child, newParent);
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
        const reg = this.registerTick(this.systemNode, kind, phase, fn, order);
        return { dispose: () => reg.dispose() };
    }

    /**
     * Registers a tick on a node.
     * @param node The node to register the tick on.
     * @param kind The kind of tick.
     * @param phase The phase of the tick.
     * @param fn The tick function.
     * @param order The order of the tick.
     * @returns The tick registration.
     */
    registerTick(
        node: Node,
        kind: UpdateKind,
        phase: UpdatePhase,
        fn: TickFn,
        order = 0,
    ): TickRegistration {
        const reg = this.ticker.register(node, kind, phase, fn, order);
        (node as any)[kRegisteredTicks].push(reg);
        return reg;
    }

    /**
     * Starts the world.
     */
    start(): void {
        this.loop.start();
    }

    /**
     * Stops the world.
     */
    stop(): void {
        this.loop.stop();
    }

    /**
     * Ticks the world.
     * @param dtMs The delta time in milliseconds.
     */
    tick(dtMs: number): void {
        this.loop.tick(dtMs);
    }

    /**
     * Saves a snapshot of the world.
     * @returns
     */
    saveSnapshot(): WorldSnapshot {
        return this.snapshotter.save(this.loop.getAccumulator());
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
        const acc = this.snapshotter.restore(snap, opts);
        this.loop.setAccumulator(acc);
    }

    /**
     * Gets the debug stats of the world.
     * @returns The debug stats.
     */
    debugStats() {
        return {
            frameId: this.loop.getFrameId(),
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
        return this.loop.getAmbientAlpha();
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
        return this.loop.getFrameId();
    }

    //#endregion

    //#region Component registration (explicit + symbol bridge)

    /**
     * Registers a transform.
     * @param t The transform to register.
     */
    registerTransform(t: Transform) {
        this.transforms.add(t);
    }

    /**
     * Unregisters a transform.
     * @param t The transform to unregister.
     */
    unregisterTransform(t: Transform) {
        this.transforms.delete(t);
    }

    /**
     * Registers a bounds.
     * @param b The bounds to register.
     */
    registerBounds(b: Bounds) {
        this.bounds.add(b);
    }

    /**
     * Unregisters a bounds.
     * @param b The bounds to unregister.
     */
    unregisterBounds(b: Bounds) {
        this.bounds.delete(b);
    }

    //#endregion

    //#region Loop controls

    /**
     * Pauses the world.
     */
    pause() {
        this.loop.pause();
    }

    /**
     * Resumes the world.
     */
    resume() {
        this.loop.resume();
    }

    /**
     * Checks if the world is paused.
     * @returns True if the world is paused, false otherwise.
     */
    isPaused() {
        return this.loop.isPaused();
    }

    /**
     * Sets the time scale of the world.
     * @param scale The time scale.
     */
    setTimeScale(scale: number) {
        this.loop.setTimeScale(scale);
    }

    /**
     * Gets the time scale of the world.
     * @returns The time scale.
     */
    getTimeScale() {
        return this.loop.getTimeScale();
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
