import type { FC } from './fc/runtime';
import { mountFC } from './fc/runtime';
import { Scheduler, RafScheduler, TimeoutScheduler } from './schedule';
import { Node } from './node';
import type {
    UpdateKind,
    UpdatePhase,
    TickFn,
    TickRegistration,
    Ctor,
} from './types';
import { getComponent } from './componentRegistry';
import { Transform } from './components/Transform';
import { Ticker } from './world/ticker';
import { Snapshotter, type WorldSnapshot } from './world/snapshots';
import { ServiceRegistry } from './serviceRegistry';
import { SystemRegistry } from './systemRegistry';
import { EngineLoop } from './world/loop';
import { kRegisteredTicks } from './keys';
import { SceneGraph } from './world/sceneGraph';
import { Bounds } from './components/Bounds';
import { CullingSystem } from './systems/Culling';
import type { System } from './System';
import { StatsService } from './services/Stats';
import { TypedEvent } from './event';
import type { Service } from './Service';

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

    private services = new ServiceRegistry();
    private systems = new SystemRegistry();

    private ticker = new Ticker();
    private scene = new SceneGraph();
    private snapshotter!: Snapshotter;

    private idToNode = new Map<number, Node>();
    private transforms = new Set<Transform>();
    private bounds = new Set<Bounds>();
    private loop!: EngineLoop;
    private systemNode: Node | null = null;
    private nodeAddedBus = new TypedEvent<Node>();
    private nodeRemovedBus = new TypedEvent<Node>();

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

        this.snapshotter = new Snapshotter(
            this.idToNode,
            this.transforms,
            this.bounds,
        );

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
        // Provide stats service for consumers
        this.provideService(new StatsService());
        // Install default systems
        this.addSystem(new CullingSystem());
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
        return this.scene.onParentChanged(fn);
    }

    /** Subscribes to node added events. */
    onNodeAdded(fn: (node: Node) => void) {
        return this.nodeAddedBus.on(fn);
    }

    /** Subscribes to node removed events. */
    onNodeRemoved(fn: (node: Node) => void) {
        return this.nodeRemovedBus.on(fn);
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
        const t = getComponent(node, Transform);
        if (t) this.transforms.add(t);

        node.onInit?.();
        this.nodeAddedBus.emit(node);

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
        const t = getComponent(node, Transform);
        if (t) this.transforms.delete(t);

        this.idToNode.delete(node.id);
        node.world = null;
        // ticks owned by this node will be lazily unlinked during iteration
        this.nodeRemovedBus.emit(node);
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
            fps: this.loop.getFps(),
            fixedSps: this.loop.getFixedSps(),
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
     * Gets the frame ID.
     * @returns The frame ID.
     */
    getFrameId(): number {
        return this.loop.getFrameId();
    }

    /**
     * Returns current performance stats.
     */
    getPerf() {
        return { fps: this.loop.getFps(), fixedSps: this.loop.getFixedSps() };
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

    //#region Services Lifecycle

    /**
     * Provides a service.
     * @param service The service to provide.
     * @returns The service.
     */
    provideService<T extends Service>(service: T): T {
        this.services.set(service);
        service.attach(this);
        return service;
    }

    /**
     * Gets a service.
     * @param service The service to get.
     * @returns The service.
     */
    getService<T extends Service>(
        service: Ctor<T> | ThisParameterType<T>,
    ): T | undefined {
        return this.services.get(service);
    }

    /**
     * Removes a service from the world.
     * @param service The service to remove.
     */
    removeService<T extends Service>(
        service: Ctor<T> | ThisParameterType<T>,
    ): void {
        this.services.get(service)?.detach();
        this.services.remove(service);
    }

    //#endregion

    //#region Systems Lifecycle

    /**
     * Adds a system to the world.
     * @param system The system to add.
     * @returns The system.
     */
    addSystem<T extends System>(system: T): T {
        this.systems.set(system);
        system.attach(this);
        return system;
    }

    /**
     * Gets a system.
     * @param system The system to get.
     * @returns The system.
     */
    getSystem<T extends System>(
        system: Ctor<T> | ThisParameterType<T>,
    ): T | undefined {
        return this.systems.get(system);
    }

    /**
     * Removes a system from the world.
     * @param system The system to remove.
     */
    removeSystem<T extends System>(
        system: Ctor<T> | ThisParameterType<T>,
    ): void {
        this.systems.get(system)?.detach();
        this.systems.remove(system);
    }

    //#endregion

    //#region Ticker Controls

    /**
     * Sets the enabled state of a node.
     * @param node The node to set the enabled state of.
     * @param enabled The enabled state of the node.
     */
    setNodeTicksEnabled(node: Node, enabled: boolean) {
        this.ticker.setNodeEnabled(node, enabled);
    }

    /**
     * Sets the enabled state of a phase.
     * @param kind The kind of tick.
     * @param phase The phase of the tick.
     * @param enabled The enabled state of the phase.
     */
    setPhaseEnabled(kind: UpdateKind, phase: UpdatePhase, enabled: boolean) {
        this.ticker.setPhaseEnabled(kind, phase, enabled);
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
