import { Node } from '../node';
import type {
    UpdateKind,
    UpdatePhase,
    TickFn,
    TickRegistration,
} from '../types';

/**
 * The tick lane interface.
 */
interface TickLane {
    head: RegInternal | null;
    tail: RegInternal | null;
    size: number;
}

/**
 * The internal registration interface.
 */
interface RegInternal extends TickRegistration {
    prev: RegInternal | null;
    next: RegInternal | null;
    lane: TickLane;
}

/**
 * Makes a new lane.
 * @returns The new lane.
 */
function makeLane(): TickLane {
    return { head: null, tail: null, size: 0 };
}

/**
 * Appends a registration to a lane.
 * @param l The lane to append to.
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

/**
 * The order buckets are used to store the registrations for a given kind and phase.
 */
type OrderBuckets = Map<number, TickLane>;

/**
 * Ticker is responsible for managing the order of updates for a given node.
 */
export class Ticker {
    //#region Fields

    /**
     * The buckets are used to store the registrations for a given kind and phase.
     */
    private buckets: Record<UpdateKind, Record<UpdatePhase, OrderBuckets>> = {
        fixed: { early: new Map(), update: new Map(), late: new Map() },
        frame: { early: new Map(), update: new Map(), late: new Map() },
    };

    /**
     * The order keys are used to store the orders for a given kind and phase.
     */
    private orderKeys: Record<UpdateKind, Record<UpdatePhase, number[]>> = {
        fixed: { early: [], update: [], late: [] },
        frame: { early: [], update: [], late: [] },
    };

    //#endregion

    //#region Public Methods

    /**
     * Registers a node for a given kind and phase.
     * @param node The node to register.
     * @param kind The kind of update.
     * @param phase The phase of the update.
     * @param fn The function to call for the update.
     * @param order The order of the update.
     * @returns The registration.
     */
    register(
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
     * Runs a phase of updates for a given kind and phase.
     * @param kind The kind of update.
     * @param phase The phase of the update.
     * @param dt The delta time.
     * @param liveNodes The set of live nodes.
     */
    runPhase(
        kind: UpdateKind,
        phase: UpdatePhase,
        dt: number,
        liveNodes: Set<Node>,
    ) {
        const orders = this.orderKeys[kind][phase];
        for (let oi = 0; oi < orders.length; oi++) {
            const lane = this.buckets[kind][phase].get(orders[oi])!;
            const boundary = lane.tail;
            for (let r = lane.head; r; ) {
                const next = r.next;
                if (!r.active || !liveNodes.has(r.node)) {
                    unlink(r);
                } else {
                    try {
                        r.fn(dt);
                    } catch (e) {
                        console.error(e);
                    }
                }
                if (r === boundary) break; // new regs appended after boundary => next frame
                r = next;
            }
        }
    }

    /**
     * Returns the stats for the ticker.
     * @param liveNodes The set of live nodes.
     * @returns The stats for the ticker.
     */
    stats(liveNodes: Set<Node>) {
        const agg = (kind: UpdateKind, phase: UpdatePhase) => {
            const buckets = this.buckets[kind][phase];
            let size = 0,
                active = 0;
            for (const lane of buckets.values()) {
                size += lane.size;
                for (let r = lane.head; r; r = r.next) {
                    if (r.active && liveNodes.has(r.node)) active++;
                }
            }
            return { size, active, order: this.orderKeys[kind][phase].slice() };
        };
        return {
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
        };
    }

    //#endregion

    //#region Private Methods

    /**
     * Returns the lane for a given kind and phase.
     * @param kind The kind of update.
     * @param phase The phase of the update.
     * @param order The order of the update.
     * @returns The lane for the given kind and phase.
     */
    private laneFor(
        kind: UpdateKind,
        phase: UpdatePhase,
        order: number,
    ): TickLane {
        const buckets = this.buckets[kind][phase];
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

    //#endregion
}
