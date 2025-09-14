import { Service } from '@pulse-ts/core';
import type { Unsubscribe } from '../types';
import { TransportService } from './TransportService';
import { ReservedChannels } from '../messaging/reserved';

type RpcEnvelope =
    | { t: 'req'; id: string; m: string; p: any; from?: string }
    | { t: 'res'; id: string; r?: any; e?: { message?: string } };

/**
 * Lightweight RPC over TransportService using a reserved channel.
 *
 * - Broadcast topology: any peer with a registered handler for `m` may respond.
 * - Correlation via `id`; timeouts supported client-side.
 * - Payloads are codec-encoded by TransportService (JSON by default).
 */
export class RpcService extends Service {
    private handlers = new Map<string, (payload: any) => any | Promise<any>>();
    private pending = new Map<
        string,
        { resolve: (v: any) => void; reject: (e: any) => void; timer?: any }
    >();
    private unsub: Unsubscribe | null = null;

    /**
     * Registers a method handler.
     * @param name Method name.
     * @param fn Async or sync handler returning the result payload.
     * @returns Unsubscribe function.
     */
    register<Req = unknown, Res = unknown>(
        name: string,
        fn: (payload: Req) => Res | Promise<Res>,
    ): Unsubscribe {
        this.handlers.set(name, fn as any);
        this.ensureSubscribed();
        return () => this.handlers.delete(name);
    }

    /**
     * Calls a remote method by broadcasting a request and awaiting the first response.
     * @param name Method name.
     * @param payload Request payload.
     * @param opts Timeout options.
     */
    async call<Req = unknown, Res = unknown>(
        name: string,
        payload: Req,
        opts: { timeoutMs?: number } = {},
    ): Promise<Res> {
        const svc = this.ensureTransport();
        this.ensureSubscribed();
        const id = this.makeId();
        const timeoutMs = opts.timeoutMs ?? 5000;
        const p = new Promise<Res>((resolve, reject) => {
            const timer = setTimeout(() => {
                this.pending.delete(id);
                reject(new Error(`RPC timeout for ${name}`));
            }, timeoutMs);
            this.pending.set(id, { resolve, reject, timer });
        });
        const from = svc.getSelfId();
        const env: RpcEnvelope = { t: 'req', id, m: name, p: payload, from };
        svc.publish(ReservedChannels.RPC, env);
        return p;
    }

    /**
     * Calls a remote method on a specific peer and awaits the response.
     */
    async callTo<Req = unknown, Res = unknown>(
        peerId: string,
        name: string,
        payload: Req,
        opts: { timeoutMs?: number } = {},
    ): Promise<Res> {
        const svc = this.ensureTransport();
        this.ensureSubscribed();
        const id = this.makeId();
        const timeoutMs = opts.timeoutMs ?? 5000;
        const p = new Promise<Res>((resolve, reject) => {
            const timer = setTimeout(() => {
                this.pending.delete(id);
                reject(new Error(`RPC timeout for ${name}`));
            }, timeoutMs);
            this.pending.set(id, { resolve, reject, timer });
        });
        const from = svc.getSelfId();
        const env: RpcEnvelope = { t: 'req', id, m: name, p: payload, from };
        svc.publishTo(ReservedChannels.RPC, peerId, env);
        return p;
    }

    /** Ensure we are listening to the RPC channel. */
    private ensureSubscribed() {
        if (this.unsub) return;
        const svc = this.ensureTransport();
        this.unsub = svc.subscribe<RpcEnvelope>(
            ReservedChannels.RPC,
            async (env) => {
                if (!env || typeof env !== 'object') return;
                if ((env as any).t === 'req') {
                    const { id, m, p, from } = env as Extract<
                        RpcEnvelope,
                        { t: 'req' }
                    >;
                    const fn = this.handlers.get(m);
                    if (!fn) return;
                    try {
                        const r = await fn(p);
                        const res: RpcEnvelope = { t: 'res', id, r } as any;
                        if (from)
                            svc.publishTo(ReservedChannels.RPC, from, res);
                        else svc.publish(ReservedChannels.RPC, res);
                    } catch (e: any) {
                        const errEnv: RpcEnvelope = {
                            t: 'res',
                            id,
                            e: { message: e?.message ?? String(e) },
                        } as any;
                        if (from)
                            svc.publishTo(ReservedChannels.RPC, from, errEnv);
                        else svc.publish(ReservedChannels.RPC, errEnv);
                    }
                } else if ((env as any).t === 'res') {
                    const { id, r, e } = env as Extract<
                        RpcEnvelope,
                        { t: 'res' }
                    >;
                    const pend = this.pending.get(id);
                    if (!pend) return;
                    this.pending.delete(id);
                    if (pend.timer) clearTimeout(pend.timer);
                    if (e) pend.reject(new Error(e.message ?? 'RPC error'));
                    else pend.resolve(r);
                }
            },
        );
    }

    private ensureTransport() {
        const svc =
            this.world?.getService(TransportService) ??
            this.world?.provideService(new TransportService());
        if (!svc) throw new Error('World not attached');
        return svc;
    }

    private makeId() {
        // Fast, non-cryptographic unique-ish ID for correlation
        return Math.random().toString(36).slice(2) + Date.now().toString(36);
    }
}
