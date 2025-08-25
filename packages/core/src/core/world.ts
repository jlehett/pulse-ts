import { Node } from './node';
import { Group } from './group';
import { Signal } from './signals';
import {
    UpdatePhase,
    type UpdateKind,
    hasTick,
    getTickOrder,
    callTick,
    getTickMetadata,
} from '../capabilities/tick';
import { defaultScheduler, type Scheduler } from '../scheduler';

type NodeSet = Set<Node>;
const PHASES: UpdatePhase[] = [
    UpdatePhase.Early,
    UpdatePhase.Update,
    UpdatePhase.Late,
];
const KINDS: UpdateKind[] = ['fixed', 'frame'];

export const internal_indexTagAdd = Symbol('world:indexTagAdd');
export const internal_indexTagRemove = Symbol('world:indexTagRemove');
export const internal_notifyParentChanged = Symbol('world:notifyParentChanged');

/**
 * The World owns nodes, phase/kind schedules, tags, and the run loop.
 * Start/stop the world directly; bring your own Scheduler if you want.
 */
export class World {
    // #region Fields

    /** All nodes by id (public for internal helpers; treat as internal). */
    readonly nodes = new Map<number, Node>();

    /* Membership sets per kind/phase. */
    private readonly kindPhaseMembership: Record<
        UpdateKind,
        Record<UpdatePhase, NodeSet>
    > = {
        fixed: {
            [UpdatePhase.Early]: new Set(),
            [UpdatePhase.Update]: new Set(),
            [UpdatePhase.Late]: new Set(),
        },
        frame: {
            [UpdatePhase.Early]: new Set(),
            [UpdatePhase.Update]: new Set(),
            [UpdatePhase.Late]: new Set(),
        },
    };

    /* Cached dirty flags for schedules. */
    private readonly scheduleDirty: Record<
        UpdateKind,
        Record<UpdatePhase, boolean>
    > = {
        fixed: {
            [UpdatePhase.Early]: true,
            [UpdatePhase.Update]: true,
            [UpdatePhase.Late]: true,
        },
        frame: {
            [UpdatePhase.Early]: true,
            [UpdatePhase.Update]: true,
            [UpdatePhase.Late]: true,
        },
    };

    /* Cached schedules (sorted arrays). */
    private readonly schedule: Record<UpdateKind, Record<UpdatePhase, Node[]>> =
        {
            fixed: {
                [UpdatePhase.Early]: [],
                [UpdatePhase.Update]: [],
                [UpdatePhase.Late]: [],
            },
            frame: {
                [UpdatePhase.Early]: [],
                [UpdatePhase.Update]: [],
                [UpdatePhase.Late]: [],
            },
        };

    // Tag index
    private readonly tagIndex = new Map<string, NodeSet>();

    // Deferral for safe iteration
    private pendingAdds: Node[] = [];
    private pendingRemoves: Node[] = [];
    private isStepping = false;

    // Run loop
    private readonly scheduler: Scheduler;
    private isRunningFlag = false;
    private accumulatorMilliseconds = 0;
    private lastInterpolationAlpha = 0;
    private fixedStepMilliseconds: number;
    private maxCatchupMilliseconds: number;

    // Signals (event bus)
    readonly onNodeAdded = new Signal<Node>();
    readonly onNodeRemoved = new Signal<Node>();
    readonly onTagAdded = new Signal<{ node: Node; tag: string }>();
    readonly onTagRemoved = new Signal<{ node: Node; tag: string }>();
    readonly onParentChanged = new Signal<{
        node: Node;
        previousParent: Node | null;
        nextParent: Node | null;
    }>();

    //#endregion

    constructor(options?: {
        fixedStepMs?: number;
        maxCatchupMs?: number;
        scheduler?: Scheduler;
    }) {
        this.fixedStepMilliseconds = options?.fixedStepMs ?? 1000 / 60;
        this.maxCatchupMilliseconds = options?.maxCatchupMs ?? 250;
        this.scheduler = options?.scheduler ?? defaultScheduler();
    }

    //#region Public Methods

    //#region Run Controls

    /**
     * Start the world's run loop (fixed+frame).
     */
    start(): void {
        if (this.isRunningFlag) return;
        this.isRunningFlag = true;
        this.scheduler.start(
            (deltaMilliseconds) => this.onTick(deltaMilliseconds),
            this.fixedStepMilliseconds,
        );
    }

    /**
     * Stop the world's run loop.
     */
    stop(): void {
        if (!this.isRunningFlag) return;
        this.isRunningFlag = false;
        this.scheduler.stop();
    }

    /**
     * Get flag indicating whether the world is currently running.
     * @returns True if the world is running; otherwise, false.
     */
    isRunning(): boolean {
        return this.isRunningFlag;
    }

    /**
     * Manual advance by real-time delta (milliseconds). Handy for tests.
     * @param realDeltaMilliseconds The real-time delta in milliseconds.
     */
    tickOnce(realDeltaMilliseconds: number): void {
        this.onTick(realDeltaMilliseconds);
    }

    /**
     * Change the fixed-step duration in milliseconds.
     * @param milliseconds The fixed-step duration in milliseconds.
     */
    setFixedStepMs(milliseconds: number): void {
        this.fixedStepMilliseconds = Math.max(1, Math.floor(milliseconds));
        this.accumulatorMilliseconds = Math.min(
            this.accumulatorMilliseconds,
            this.fixedStepMilliseconds,
        );
    }

    /**
     * Get the interpolation factor from last tick (0..1).
     * @returns The interpolation factor from last tick (0..1).
     */
    getInterpolationAlpha(): number {
        return this.lastInterpolationAlpha;
    }

    /**
     * Deterministic fixed-step tick (deltaSeconds).
     * @param deltaSeconds The delta in seconds.
     */
    stepFixed(deltaSeconds: number): void {
        this.flushAdds();
        this.isStepping = true;
        try {
            this.runKind('fixed', deltaSeconds);
        } finally {
            this.isStepping = false;
        }
        this.flushRemoves();
    }

    /**
     * Variable frame-step tick (deltaSeconds).
     * @param deltaSeconds The delta in seconds.
     * @param _alpha The interpolation factor from last tick (0..1).
     */
    stepFrame(deltaSeconds: number, _alpha?: number): void {
        this.flushAdds();
        this.isStepping = true;
        try {
            this.runKind('frame', deltaSeconds);
        } finally {
            this.isStepping = false;
        }
        this.flushRemoves();
    }

    //#endregion

    //#region Core API

    /**
     * Add a node to the world.
     * @param node The node to add.
     * @returns The node.
     */
    add<T extends Node>(node: T): T {
        if (node.world && node.world !== this)
            throw new Error('Node belongs to another World.');
        if (this.isStepping) {
            this.pendingAdds.push(node);
            return node;
        }
        this.attachNow(node);
        return node;
    }

    /**
     * Remove a node from the world.
     * @param node The node to remove.
     */
    remove(node: Node): void {
        if (node.world !== this) return;
        if (this.isStepping) {
            this.pendingRemoves.push(node);
            return;
        }
        this.detachNow(node);
    }

    /**
     * Get the number of nodes in the world.
     * @returns The number of nodes in the world.
     */
    count(): number {
        return this.nodes.size;
    }

    /**
     * Get a node by id.
     * @param id The id of the node to get.
     * @returns The node, or undefined if not found.
     */
    getById<T extends Node = Node>(id: number): T | undefined {
        return this.nodes.get(id) as T | undefined;
    }

    /**
     * Iterator over nodes by tag (use groups for live membership).
     * @param tag The tag to query for.
     * @returns An iterator over the nodes that carry the specified tag.
     */
    *queryByTag(tag: string): IterableIterator<Node> {
        const set = this.tagIndex.get(tag);
        if (!set) return;
        for (const node of set) yield node;
    }

    /**
     * Create a live Group of nodes that match the predicate.
     * @param predicate The predicate to match nodes against.
     * @returns A Group of nodes that match the predicate.
     */
    group(predicate: (node: Node) => boolean): Group {
        return new Group(this, predicate);
    }

    //#endregion

    //#endregion

    //#region Internal Library Methods

    /**
     * @internal: maintain the tag index; invoked by Node.addTag()
     * @param node The node to index.
     * @param tag The tag to index.
     */
    [internal_indexTagAdd](node: Node, tag: string): void {
        let set = this.tagIndex.get(tag);
        if (!set) {
            set = new Set();
            this.tagIndex.set(tag, set);
        }
        set.add(node);
        this.onTagAdded.emit({ node, tag });
    }

    /**
     * @internal: maintain the tag index; invoked by Node.removeTag()
     * @param node The node to unindex.
     * @param tag The tag to unindex.
     */
    [internal_indexTagRemove](node: Node, tag: string): void {
        const set = this.tagIndex.get(tag);
        if (!set) return;
        if (set.delete(node)) {
            if (set.size === 0) this.tagIndex.delete(tag);
            this.onTagRemoved.emit({ node, tag });
        }
    }

    /**
     * @internal: invoked by Node when parent changes.
     * @param node The node whose parent changed.
     * @param previousParent The previous parent of the node.
     * @param nextParent The new parent of the node.
     */
    [internal_notifyParentChanged](
        node: Node,
        previousParent: Node | null,
        nextParent: Node | null,
    ): void {
        this.onParentChanged.emit({ node, previousParent, nextParent });
    }

    //#endregion

    //#region Private Methods

    /**
     * Called by the scheduler to advance the world by one frame tick and one+ fixed steps.
     * @param deltaMilliseconds The delta in milliseconds since the last tick.
     */
    private onTick(deltaMilliseconds: number): void {
        // Clamp huge stalls to avoid doing too many fixed steps after a tab sleep
        const clamped = Math.min(
            deltaMilliseconds,
            this.maxCatchupMilliseconds,
        );
        this.accumulatorMilliseconds += clamped;

        while (this.accumulatorMilliseconds >= this.fixedStepMilliseconds) {
            this.stepFixed(this.fixedStepMilliseconds / 1000);
            this.accumulatorMilliseconds -= this.fixedStepMilliseconds;
        }

        const alpha = this.accumulatorMilliseconds / this.fixedStepMilliseconds;
        this.lastInterpolationAlpha = alpha;
        this.stepFrame(clamped / 1000, alpha);
    }

    /**
     * Attach a node to the world.
     * @param node The node to attach.
     */
    private attachNow(node: Node): void {
        node.world = this;
        this.nodes.set(node.id, node);

        // index tags
        for (const tag of node.tags) this[internal_indexTagAdd](node, tag);

        // index phase/kind membership based on instance metadata
        const metadata = getTickMetadata(node);
        if (metadata) {
            for (const kind of KINDS) {
                for (const phase of PHASES) {
                    if (hasTick(node, kind, phase)) {
                        this.kindPhaseMembership[kind][phase].add(node);
                        this.scheduleDirty[kind][phase] = true;
                    }
                }
            }
        }

        this.onNodeAdded.emit(node);
        (node as any).onAddedToWorld?.();
    }

    /**
     * Detach a node from the world.
     * @param node The node to detach.
     */
    private detachNow(node: Node): void {
        // detach children first
        for (const child of Array.from(node.children)) node.removeChild(child);

        // unindex from schedules
        for (const kind of KINDS) {
            for (const phase of PHASES) {
                if (this.kindPhaseMembership[kind][phase].delete(node)) {
                    this.scheduleDirty[kind][phase] = true;
                }
            }
        }

        // unindex tags
        for (const tag of node.tags) this[internal_indexTagRemove](node, tag);

        this.nodes.delete(node.id);
        (node as any).onRemovedFromWorld?.();
        node.world = null;

        this.onNodeRemoved.emit(node);
    }

    /**
     * Flush pending adds.
     */
    private flushAdds(): void {
        if (this.pendingAdds.length === 0) return;
        const additions = this.pendingAdds;
        this.pendingAdds = [];
        for (const n of additions) this.attachNow(n);
    }

    /**
     * Flush pending removes.
     */
    private flushRemoves(): void {
        if (this.pendingRemoves.length === 0) return;
        const removals = this.pendingRemoves;
        this.pendingRemoves = [];
        for (const n of removals) this.detachNow(n);
    }

    /**
     * Build the schedule for a given kind and phase.
     * @param kind The kind of update.
     * @param phase The phase of update.
     */
    private buildSchedule(kind: UpdateKind, phase: UpdatePhase): void {
        const list = Array.from(this.kindPhaseMembership[kind][phase]);
        list.sort(
            (a, b) =>
                getTickOrder(a, kind, phase) - getTickOrder(b, kind, phase),
        );
        this.schedule[kind][phase] = list;
        this.scheduleDirty[kind][phase] = false;
    }

    /**
     * Run all phases of a kind of update (e.g., fixed or frame).
     * @param kind The kind of update (e.g., fixed or frame).
     * @param deltaSeconds The delta in seconds.
     */
    private runKind(kind: UpdateKind, deltaSeconds: number): void {
        for (const phase of PHASES) {
            if (this.scheduleDirty[kind][phase])
                this.buildSchedule(kind, phase);
            const scheduled = this.schedule[kind][phase];
            for (const node of scheduled)
                callTick(node, kind, phase, deltaSeconds);
        }
    }

    //#endregion
}
