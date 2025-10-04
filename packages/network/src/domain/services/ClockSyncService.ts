import { Service } from '@pulse-ts/core';
import { TypedEvent } from '@pulse-ts/core';
import { TransportService } from './TransportService';
import { ReservedChannels } from '../messaging/reserved';

type PingEnv =
    | { t: 'ping'; id: string; cSendMs: number }
    | { t: 'pong'; id: string; sNowMs: number };

/**
 * Estimates server clock offset/drift via periodic pings over a reserved channel.
 *
 * - Offset = best (min-RTT) sample of sNowMs - (cSend+cRecv)/2.
 * - Provides `getServerNowMs()` for consumers that need authoritative timers.
 */
export class ClockSyncService extends Service {
    private running = false;
    private offUnsub: (() => void) | null = null;
    private seq = 0;
    private inflight = new Map<string, number>();

    private bestOffsetMs = 0;
    private bestRttMs = Infinity;
    private samples = 0;

    readonly onSample = new TypedEvent<{ offsetMs: number; rttMs: number }>();

    constructor(private opts: { intervalMs?: number; burst?: number } = {}) {
        super();
        this.opts.intervalMs ??= 2000;
        this.opts.burst ??= 1;
    }

    /** Starts periodic clock sync pings. Idempotent. */
    start() {
        if (this.running) return;
        this.running = true;
        const svc = this.ensureTransport();
        if (!this.offUnsub)
            this.offUnsub = svc.subscribe<PingEnv>(
                ReservedChannels.CLOCK,
                (env) => this.onMessage(env),
            );
        // Kick first burst immediately
        this.pingBurst();
        // Schedule future pings
        const int = this.opts.intervalMs!;
        const loop = () => {
            if (!this.running) return;
            this.pingBurst();
            setTimeout(loop, int);
        };
        setTimeout(loop, int);
    }

    /** Stops clock sync. */
    stop() {
        this.running = false;
        this.offUnsub?.();
        this.offUnsub = null;
        this.inflight.clear();
    }

    /** Returns the current best-known server->client offset in ms. */
    getOffsetMs(): number {
        return this.bestOffsetMs;
    }

    /** Returns an estimated server time in ms. */
    getServerNowMs(): number {
        return Date.now() + this.bestOffsetMs;
    }

    /** Returns sampling stats. */
    getStats() {
        return {
            samples: this.samples,
            bestRttMs: this.bestRttMs === Infinity ? 0 : this.bestRttMs,
            offsetMs: this.bestOffsetMs,
        };
    }

    private onMessage(env: PingEnv) {
        if ((env as any).t !== 'pong') return;
        const { id, sNowMs } = env as Extract<PingEnv, { t: 'pong' }>;
        const t3 = Date.now();
        const t1 = this.inflight.get(id);
        if (t1 == null) return;
        this.inflight.delete(id);
        const rtt = Math.max(0, t3 - t1);
        const offset = sNowMs - (t1 + t3) / 2;
        this.samples++;
        if (rtt < this.bestRttMs) {
            this.bestRttMs = rtt;
            this.bestOffsetMs = offset;
        }
        this.onSample.emit({ offsetMs: offset, rttMs: rtt });
    }

    private pingBurst() {
        const svc = this.ensureTransport();
        for (let i = 0; i < (this.opts.burst ?? 1); i++) this.pingOnce(svc);
    }

    private pingOnce(svc: TransportService) {
        const id = this.makeId();
        const cSendMs = Date.now();
        this.inflight.set(id, cSendMs);
        svc.publish<PingEnv>(ReservedChannels.CLOCK, {
            t: 'ping',
            id,
            cSendMs,
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
            (this.seq++).toString(36)
        );
    }
}
