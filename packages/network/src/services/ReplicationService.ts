import { Service } from '@pulse-ts/core';
import type { Unsubscribe } from '../types';
import { TransportService } from './TransportService';
import type { SnapshotEnvelope } from '../replication/protocol';
import { shallowDelta } from '../replication/protocol';
import { ReservedChannels } from '../messaging/reserved';

type ReadFn = () => any;
type ApplyFn = (patch: any) => void;

type ReplicaRec = {
    read?: ReadFn;
    apply?: ApplyFn;
    last?: any;
    dirty?: boolean;
};

/**
 * Service for entity replication via periodic snapshots/deltas.
 *
 * - Entities are identified by StableId.id (provided via user code).
 * - A "replica" is a named state slice under an entity (e.g., 'transform').
 * - Replicas provide `read()` to snapshot state and `apply(patch)` to consume deltas.
 * - Shallow diff is used for delta; custom equality can be done inside `read()`.
 */
export class ReplicationService extends Service {
    private map = new Map<
        string /*entityId*/,
        Map<string /*replicaKey*/, ReplicaRec>
    >();
    private seq = 0;
    private sendAccum = 0;
    private unsub: Unsubscribe | null = null;

    private sentEntities = 0;
    private sentReplicas = 0;

    constructor(private opts: { channel?: string; sendHz?: number } = {}) {
        super();
        this.opts.channel ??= ReservedChannels.REPL;
        this.opts.sendHz ??= 20;
    }

    /**
     * Updates replication options (channel and/or send rate).
     */
    configure(opts: Partial<{ channel: string; sendHz: number }>) {
        if (opts.channel) this.opts.channel = opts.channel;
        if (typeof opts.sendHz === 'number' && opts.sendHz > 0)
            this.opts.sendHz = opts.sendHz;
    }

    /** Registers a replica under an entity id. Returns a disposer. */
    register(
        entityId: string,
        key: string,
        rec: { read?: ReadFn; apply?: ApplyFn },
    ): () => void {
        let m = this.map.get(entityId);
        if (!m) this.map.set(entityId, (m = new Map()));
        const existing = m.get(key);
        if (existing) {
            // Merge roles if re-registering (e.g., both read/apply across mounts)
            existing.read = rec.read ?? existing.read;
            existing.apply = rec.apply ?? existing.apply;
        } else {
            m.set(key, { ...rec });
        }
        this.ensureSubscribed();
        return () => {
            const mm = this.map.get(entityId);
            if (!mm) return;
            mm.delete(key);
            if (mm.size === 0) this.map.delete(entityId);
        };
    }

    /** Marks a replica dirty (forces inclusion in next snapshot). */
    markDirty(entityId: string, key?: string) {
        const m = this.map.get(entityId);
        if (!m) return;
        if (key) {
            const r = m.get(key);
            if (r) r.dirty = true;
        } else {
            for (const r of m.values()) r.dirty = true;
        }
    }

    /** Ticks snapshot scheduling; call from a System. */
    tick(dt: number) {
        const period = 1 / (this.opts.sendHz ?? 20);
        this.sendAccum += dt;
        if (this.sendAccum >= period) {
            this.sendAccum -= period;
            this.sendSnapshot();
        }
    }

    /** Sends a delta snapshot to all peers via TransportService. */
    sendSnapshot() {
        const svc = this.world?.getService(TransportService);
        if (!svc) return;
        const env = this.buildDeltaEnvelope();
        if (!env) return;
        svc.publish(this.opts.channel!, env);
    }

    /** Builds a delta envelope from current state; returns undefined if no changes. */
    private buildDeltaEnvelope(): SnapshotEnvelope | undefined {
        const ents: SnapshotEnvelope['ents'] = [];
        let replicasAdded = 0;
        for (const [eid, reps] of this.map) {
            const out: Record<string, any> = {};
            for (const [key, rec] of reps) {
                if (!rec.read) continue;
                const now = safeRead(rec.read);
                const delta = rec.dirty ? now : shallowDelta(now, rec.last);
                if (delta !== undefined) {
                    out[key] = delta;
                    rec.last = now;
                    rec.dirty = false;
                    replicasAdded++;
                }
            }
            if (Object.keys(out).length) ents.push({ id: eid, reps: out });
        }
        if (!ents.length) return undefined;
        const env: SnapshotEnvelope = { t: 'snap', seq: ++this.seq, ents };
        this.sentEntities += ents.length;
        this.sentReplicas += replicasAdded;
        return env;
    }

    /** Applies an incoming snapshot to any registered consumers. */
    private applySnapshot(env: SnapshotEnvelope) {
        for (const e of env.ents) {
            const reps = this.map.get(e.id);
            if (!reps) continue;
            for (const k in e.reps) {
                const rec = reps.get(k);
                if (rec?.apply) {
                    try {
                        rec.apply(e.reps[k]);
                    } catch (err) {
                        console.error('[Replication] apply error', err);
                    }
                }
            }
        }
    }

    /** Ensure we are subscribed to the replication channel. */
    private ensureSubscribed() {
        if (this.unsub) return;
        const svc =
            this.world?.getService(TransportService) ??
            this.world?.provideService(new TransportService());
        if (!svc) throw new Error('World not attached');
        this.unsub = svc.subscribe<SnapshotEnvelope>(
            this.opts.channel!,
            (env) => {
                if (!env || (env as any).t !== 'snap') return;
                this.applySnapshot(env);
            },
        );
    }

    /** Returns basic replication stats. */
    getStats() {
        return {
            seq: this.seq,
            entitiesTracked: this.map.size,
            sentEntities: this.sentEntities,
            sentReplicas: this.sentReplicas,
            sendHz: this.opts.sendHz ?? 20,
        };
    }
}

function safeRead(fn: ReadFn) {
    try {
        return fn();
    } catch (e) {
        console.error('[Replication] read() failed', e);
        return undefined;
    }
}
