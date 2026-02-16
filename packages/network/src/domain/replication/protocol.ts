/**
 * Snapshot message envelope for replication. Sent over the `__rep` channel.
 */
export type SnapshotEnvelope = {
    /** Message type. Currently only 'snap'. */
    t: 'snap';
    /** Monotonic sequence for ordering. */
    seq: number;
    /** True for full snapshot; omitted/false for delta. */
    full?: boolean;
    /** Entities with replica patches. */
    ents: Array<{
        /** Stable entity identifier (StableId.id). */
        id: string;
        /** Replica key -> shallow patch object. */
        reps: Record<string, any>;
    }>;
};

/**
 * Returns a shallow delta between two plain objects (changed keys only).
 * Undefined means no change. Null is a valid value and included.
 *
 * @param now Current object.
 * @param last Previous object.
 * @returns Patch object or `undefined` if no changes.
 *
 * @example
 * shallowDelta({ a: 1, b: 2 }, { a: 1, b: 0 }) // => { b: 2 }
 */
export function shallowDelta(now: any, last: any): any | undefined {
    if (now === last) return undefined;
    if (typeof now !== 'object' || now === null) return now;
    if (typeof last !== 'object' || last === null) return now;
    let anyChange = false;
    const out: any = {};
    const keys = new Set<string>([
        ...Object.keys(now),
        ...Object.keys(last ?? {}),
    ]);
    for (const k of keys) {
        const a = (now as any)[k];
        const b = (last as any)[k];
        if (a !== b) {
            out[k] = a;
            anyChange = true;
        }
    }
    return anyChange ? out : undefined;
}
