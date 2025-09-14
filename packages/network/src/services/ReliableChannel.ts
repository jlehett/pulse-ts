import { Service } from '@pulse-ts/core';
import { TransportService } from './TransportService';
import type { Unsubscribe } from '../types';
import { ReservedChannels } from '../messaging/reserved';

type ReqEnv = {
    t: 'req';
    id: string;
    topic: string;
    payload: any;
    seq: number;
    cAt?: number;
};

type AckEnv = {
    t: 'ack';
    id: string;
    status: 'ok' | 'error';
    result?: any;
    reason?: string;
    srvSeq?: number;
};

/** Result of a reliable send. */
export interface ReliableResult<T = unknown> {
    status: 'ok' | 'error';
    result?: T;
    reason?: string;
    serverSeq?: number;
}

/**
 * Generic reliable request/ack channel over `TransportService` using a reserved channel.
 *
 * - Provides correlation IDs, retries with timeout, and in-order sequencing per client.
 * - Server is expected to respond with an `ack` envelope on a reserved channel with the same id.
 */
type PendingEntry = {
    resolve: (v: ReliableResult) => void;
    reject: (e: any) => void;
    timer?: ReturnType<typeof setTimeout> | undefined;
    retriesLeft: number;
    topic: string;
    payload: any;
    timeoutMs: number;
};

export class ReliableChannelService extends Service {
    private unsub: Unsubscribe | null = null;
    private seq = 0;
    private pending = new Map<string, PendingEntry>();

    constructor(
        private defaults: { timeoutMs?: number; retries?: number } = {},
    ) {
        super();
        this.defaults.timeoutMs ??= 4000;
        this.defaults.retries ??= 1;
    }

    /** Sends a reliable request to a server handler registered for `topic`. */
    send<TReq = unknown, TRes = unknown>(
        topic: string,
        payload: TReq,
        opts: { timeoutMs?: number; retries?: number } = {},
    ): Promise<ReliableResult<TRes>> {
        this.ensureSubscribed();
        const timeoutMs = opts.timeoutMs ?? this.defaults.timeoutMs!;
        const retries = opts.retries ?? this.defaults.retries!;
        const id = this.makeId();
        const env: ReqEnv = {
            t: 'req',
            id,
            topic,
            payload,
            seq: this.seq++,
            cAt: Date.now(),
        };
        const svc = this.ensureTransport();
        return new Promise<ReliableResult<TRes>>((resolve, reject) => {
            const entry: PendingEntry = {
                resolve: resolve as any,
                reject,
                retriesLeft: retries,
                topic,
                payload,
                timeoutMs,
                timer: undefined,
            };
            this.pending.set(id, entry);
            const sendNow = () => {
                svc.publish<ReqEnv>(ReservedChannels.RELIABLE, env);
                entry.timer = setTimeout(() => {
                    if (entry.retriesLeft > 0) {
                        entry.retriesLeft--;
                        sendNow();
                    } else {
                        this.pending.delete(id);
                        reject(new Error('ReliableChannel timeout'));
                    }
                }, timeoutMs);
            };
            sendNow();
        });
    }

    /** Sends a reliable request addressed to a specific peer id (or ids). */
    sendTo<TReq = unknown, TRes = unknown>(
        peerId: string | string[],
        topic: string,
        payload: TReq,
        opts: { timeoutMs?: number; retries?: number } = {},
    ): Promise<ReliableResult<TRes>> {
        this.ensureSubscribed();
        const timeoutMs = opts.timeoutMs ?? this.defaults.timeoutMs!;
        const retries = opts.retries ?? this.defaults.retries!;
        const id = this.makeId();
        const env: ReqEnv = {
            t: 'req',
            id,
            topic,
            payload,
            seq: this.seq++,
            cAt: Date.now(),
        };
        const svc = this.ensureTransport();
        return new Promise<ReliableResult<TRes>>((resolve, reject) => {
            const entry: PendingEntry = {
                resolve: resolve as any,
                reject,
                retriesLeft: retries,
                topic,
                payload,
                timeoutMs,
                timer: undefined,
            };
            this.pending.set(id, entry);
            const sendNow = () => {
                svc.publishTo<ReqEnv>(ReservedChannels.RELIABLE, peerId, env);
                entry.timer = setTimeout(() => {
                    if (entry.retriesLeft > 0) {
                        entry.retriesLeft--;
                        sendNow();
                    } else {
                        this.pending.delete(id);
                        reject(new Error('ReliableChannel timeout'));
                    }
                }, timeoutMs);
            };
            sendNow();
        });
    }

    /** Returns number of inflight requests. */
    inflight(): number {
        return this.pending.size;
    }

    private ensureSubscribed() {
        const svc = this.ensureTransport();
        if (this.unsub) return;
        this.unsub = svc.subscribe<AckEnv>(ReservedChannels.RELIABLE, (env) => {
            if (!env || env.t !== 'ack') return;
            const p = this.pending.get(env.id);
            if (!p) return;
            this.pending.delete(env.id);
            if (p.timer) clearTimeout(p.timer);
            p.resolve({
                status: env.status,
                result: env.result,
                reason: env.reason,
                serverSeq: env.srvSeq,
            });
        });
    }

    private ensureTransport() {
        const svc =
            this.world?.getService(TransportService) ??
            this.world?.provideService(new TransportService());
        if (!svc) throw new Error('World not attached');
        return svc;
    }

    private makeId() {
        return (
            Math.random().toString(36).slice(2) +
            Date.now().toString(36) +
            this.seq.toString(36)
        );
    }
}
