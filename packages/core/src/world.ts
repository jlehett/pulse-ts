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

export const __worldRegisterTick = Symbol('pulse:world:registerTick');
export const __worldAddTransform = Symbol('pulse:world:addTransform');
export const __worldRemoveTransform = Symbol('pulse:world:removeTransform');

/**
 * Strongly-typed service keys
 */
export type ServiceKey<T> = symbol & { __service?: T };
export function createServiceKey<T>(desc: string): ServiceKey<T> {
    return Symbol(desc) as ServiceKey<T>;
}

/**
 * Doubly-linked list lane for O(1) unregisters
 */
interface TickLane {
    head: RegInternal | null;
    tail: RegInternal | null;
    size: number;
}
interface RegInternal extends TickRegistration {
    prev: RegInternal | null;
    next: RegInternal | null;
    lane: TickLane;
}

type OrderBuckets = Map<number, TickLane>;

export type WorldSnapshot = ReturnType<World['saveSnapshot']>;

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
    private accumulator = 0;

    private currentTickKind: UpdateKind | null = null;
    private currentTickPhase: UpdatePhase | null = null;
    private lastAlpha = 0;

    private idToNode = new Map<number, Node>();

    // scheduler buckets: kind->phase->registrations[]
    private scheduleBuckets: Record<
        UpdateKind,
        Record<UpdatePhase, OrderBuckets>
    > = {
        fixed: { early: new Map(), update: new Map(), late: new Map() },
        frame: { early: new Map(), update: new Map(), late: new Map() },
    };
    private orderKeys: Record<UpdateKind, Record<UpdatePhase, number[]>> = {
        fixed: { early: [], update: [], late: [] },
        frame: { early: [], update: [], late: [] },
    };

    // transforms present in this world
    private transforms = new Set<Transform>();

    private services = new Map<symbol, any>();

    // World events (parenting)
    private parentListeners = new Set<
        (e: {
            node: Node;
            oldParent: Node | null;
            newParent: Node | null;
        }) => void
    >();

    // single hidden node for system ticks (no per-plugin driver nodes)
    private systemNode: Node | null = null;

    private frameId = 0;

    getFrameId(): number {
        return this.frameId;
    }

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
        (this as any)[__worldAddTransform] = (t: Transform) =>
            this.transforms.add(t);
        (this as any)[__worldRemoveTransform] = (t: Transform) =>
            this.transforms.delete(t);
    }

    //#region Events

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
        this.parentListeners.add(fn);
        return () => this.parentListeners.delete(fn);
    }

    /**
     * Internal; called by Node.addChild/removeChild
     * @param node The node that changed parent.
     * @param oldParent The old parent.
     * @param newParent The new parent.
     */
    _emitNodeParentChanged(
        node: Node,
        oldParent: Node | null,
        newParent: Node | null,
    ) {
        // Internal; called by Node.addChild/removeChild
        for (const fn of this.parentListeners) {
            try {
                fn({ node, oldParent, newParent });
            } catch (e) {
                console.error(e);
            }
        }
    }

    //#endregion

    //#region Mount / Graph

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

    //#endregion

    //#region System Ticks (World-Owned)

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
        const reg = (this as any)[__worldRegisterTick](
            this.systemNode,
            kind,
            phase,
            fn,
            order,
        ) as RegInternal;
        return { dispose: () => reg.dispose() };
    }

    //#endregion

    //#region Lifecycle

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
            this.runPhase('fixed', 'early', dt);
            this.runPhase('fixed', 'update', dt);
            this.runPhase('fixed', 'late', dt);

            this.accumulator -= this.fixedStep;
            steps++;
        }
        // if we hit the guard, drop leftover time to prevent spiral
        if (steps === this.maxFixedStepsPerFrame) this.accumulator = 0;

        // frame alpha
        this.lastAlpha = this.accumulator / this.fixedStep;

        // frame phases
        const dt = dtMs / 1000;
        this.runPhase('frame', 'early', dt);
        this.runPhase('frame', 'update', dt);
        this.runPhase('frame', 'late', dt);
    }

    //#endregion

    //#region Snapshots

    /**
     * Saves a snapshot of the world.
     * @returns
     */
    saveSnapshot(): {
        transforms: Array<{
            id: number;
            p: [number, number, number];
            r: [number, number, number, number];
            s: [number, number, number];
        }>;
        accumulator: number;
    } {
        const transforms: Array<{
            id: number;
            p: [number, number, number];
            r: [number, number, number, number];
            s: [number, number, number];
        }> = [];
        for (const t of this.transforms) {
            const n = (t as any).owner as Node;
            transforms.push({
                id: n.id,
                p: [t.localPosition.x, t.localPosition.y, t.localPosition.z],
                r: [
                    t.localRotation.x,
                    t.localRotation.y,
                    t.localRotation.z,
                    t.localRotation.w,
                ],
                s: [t.localScale.x, t.localScale.y, t.localScale.z],
            });
        }
        return { transforms, accumulator: this.accumulator };
    }

    /**
     * Restores a snapshot of the world.
     * @param snap The snapshot to restore.
     * @param opts The options for the restore.
     */
    restoreSnapshot(
        snap: {
            transforms: Array<{
                id: number;
                p: [number, number, number];
                r: [number, number, number, number];
                s: [number, number, number];
            }>;
            accumulator: number;
        },
        opts?: { strict?: boolean; resetPrevious?: boolean },
    ): void {
        const strict = !!opts?.strict;
        for (const rec of snap.transforms) {
            const node = this.idToNode.get(rec.id);
            if (!node) {
                if (strict)
                    throw new Error(`restoreSnapshot: missing node ${rec.id}`);
                else continue;
            }
            const t = maybeGetTransform(node);
            if (!t) continue;
            t.setLocal({
                position: { x: rec.p[0], y: rec.p[1], z: rec.p[2] },
                rotationQuat: {
                    x: rec.r[0],
                    y: rec.r[1],
                    z: rec.r[2],
                    w: rec.r[3],
                },
                scale: { x: rec.s[0], y: rec.s[1], z: rec.s[2] },
            });
            if (opts?.resetPrevious) t.snapshotPrevious();
        }
        if (typeof snap.accumulator === 'number')
            this.accumulator = snap.accumulator;
    }

    //#endregion

    /**
     * Gets the debug stats of the world.
     * @returns The debug stats.
     */
    debugStats() {
        const agg = (kind: UpdateKind, phase: UpdatePhase) => {
            const buckets = this.scheduleBuckets[kind][phase];
            let size = 0,
                active = 0;
            for (const lane of buckets.values()) {
                size += lane.size;
                for (let r = lane.head; r; r = r.next) {
                    if (r.active && this.nodes.has(r.node)) active++;
                }
            }
            return {
                size,
                active,
                orders: this.orderKeys[kind][phase].slice(),
            };
        };
        return {
            frameId: this.frameId,
            nodes: this.nodes.size,
            transforms: this.transforms.size,
            ticks: {
                fixed: {
                    early: agg('fixed', 'early'),
                    update: agg('fixed', 'update'),
                    late: agg('fixed', 'late'),
                },
                frame: {
                    early: agg('frame', 'early'),
                    update: agg('frame', 'update'),
                    late: agg('frame', 'late'),
                },
            },
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
        const lane = this.laneFor(kind, phase, order);
        const reg: RegInternal = {
            node,
            kind,
            phase,
            order,
            fn,
            active: true,
            prev: null,
            next: null,
            lane,
            dispose: () => {
                if (!reg.active) return;
                reg.active = false;
                unlink(reg);
            },
        };
        append(lane, reg);
        return reg;
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
     * Runs a phase of the tick system.
     * @param kind The kind of tick.
     * @param phase The phase of the tick.
     * @param dt The delta time.
     */
    private runPhase(kind: UpdateKind, phase: UpdatePhase, dt: number) {
        this.currentTickKind = kind;
        this.currentTickPhase = phase;

        const orders = this.orderKeys[kind][phase];
        for (let oi = 0; oi < orders.length; oi++) {
            const lane = this.scheduleBuckets[kind][phase].get(orders[oi])!;
            for (let r = lane.head; r; ) {
                const next = r.next;
                if (!r.active || !this.nodes.has(r.node)) {
                    unlink(r);
                } else {
                    try {
                        r.fn(dt);
                    } catch (e) {
                        console.error(e);
                    }
                }
                r = next;
            }
        }

        this.currentTickPhase = null;
        this.currentTickKind = null;
    }

    /**
     * Gets the lane for a given kind, phase, and order.
     * @param kind The kind of tick.
     * @param phase The phase of the tick.
     * @param order The order of the tick.
     * @returns The lane.
     */
    private laneFor(
        kind: UpdateKind,
        phase: UpdatePhase,
        order: number,
    ): TickLane {
        const buckets = this.scheduleBuckets[kind][phase];
        let lane = buckets.get(order);
        if (!lane) {
            lane = makeLane();
            buckets.set(order, lane);
            const keys = this.orderKeys[kind][phase];
            const i = keys.findIndex((k) => k > order);
            if (i === -1) keys.push(order);
            else keys.splice(i, 0, order);
        }
        return lane;
    }
}

//#region Lane Utils

/**
 * Creates a new lane.
 * @returns The new lane.
 */
function makeLane(): TickLane {
    return {
        head: null,
        tail: null,
        size: 0,
    };
}

/**
 * Appends a registration to the end of a lane.
 * @param l The lane.
 * @param r The registration to append.
 */
function append(l: TickLane, r: RegInternal) {
    r.prev = l.tail;
    r.next = null;
    if (l.tail) l.tail.next = r;
    else l.head = r;
    l.tail = r;
    l.size++;
}

/**
 * Inserts a registration before a given registration in a lane.
 * @param l The lane.
 * @param at The registration to insert before.
 * @param r The registration to insert.
 */
function insertBefore(l: TickLane, at: RegInternal, r: RegInternal) {
    r.next = at;
    r.prev = at.prev;
    if (at.prev) at.prev.next = r;
    else l.head = r;
    at.prev = r;
    l.size++;
}

/**
 * Unlinks a registration from a lane.
 * @param r The registration to unlink.
 */
function unlink(r: RegInternal) {
    const l = r.lane;
    if (r.prev) r.prev.next = r.next;
    else if (l.head === r) l.head = r.next;
    if (r.next) r.next.prev = r.prev;
    else if (l.tail === r) l.tail = r.prev;
    r.prev = r.next = null;
    l.size--;
}

//#endregion
