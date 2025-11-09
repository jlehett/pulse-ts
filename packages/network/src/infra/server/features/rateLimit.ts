import type { Packet } from '../../../domain/types';

export interface RateLimits {
    /** Messages per second allowed per peer (default unlimited). */
    messagesPerSecond?: number;
    /** Bytes per second allowed per peer (default unlimited). */
    bytesPerSecond?: number;
    /** Multiplier for burst capacity (default 2). */
    burstMultiplier?: number;
    /** Per-channel overrides. */
    perChannel?: Record<
        string,
        { messagesPerSecond?: number; bytesPerSecond?: number }
    >;
    /** When a peer exceeds limits: drop (default) or disconnect (handled by caller). */
    disconnectOnAbuse?: boolean;
    /** Callback when a peer is rate limited. */
    onLimitExceeded?: (
        peerId: string,
        info: { channel: string; kind: RateLimitKind },
    ) => void;
}

type Bucket = {
    tokens: number;
    capacity: number;
    refillPerSec: number;
    last: number; // seconds
};

type PeerLimitState = {
    msgs?: Bucket;
    bytes?: Bucket;
    perCh?: Record<string, { msgs?: Bucket; bytes?: Bucket }>;
};

export type RateLimitKind = 'messages' | 'bytes';

function makeBucket(perSec: number, burst: number): Bucket {
    const cap = perSec * burst;
    return {
        tokens: cap,
        capacity: cap,
        refillPerSec: perSec,
        last: Date.now() / 1000,
    };
}

function allow(b: Bucket, cost: number): boolean {
    const now = Date.now() / 1000;
    const dt = Math.max(0, now - b.last);
    b.last = now;
    b.tokens = Math.min(b.capacity, b.tokens + b.refillPerSec * dt);
    if (b.tokens >= cost) {
        b.tokens -= cost;
        return true;
    }
    return false;
}

/** Stateful rate limiter utility used by NetworkServer. */
export class RateLimiter {
    private perPeer = new Map<string, PeerLimitState>();
    constructor(private limits?: RateLimits) {}

    /** Checks if a peer is allowed to send a packet of given size on channel. */
    check(
        peerId: string,
        packet: Packet,
        sizeBytes: number,
    ): { ok: true } | { ok: false; kind: RateLimitKind } {
        const limits = this.limits;
        if (!limits) return { ok: true };
        const burst = limits.burstMultiplier ?? 2;
        let st = this.perPeer.get(peerId);
        if (!st) {
            st = {};
            this.perPeer.set(peerId, st);
        }
        const chLimits = limits.perChannel?.[packet.channel];

        // messages bucket (global or per-channel)
        if (
            (limits.messagesPerSecond || chLimits?.messagesPerSecond) &&
            !st.msgs &&
            limits.messagesPerSecond
        )
            st.msgs = makeBucket(limits.messagesPerSecond, burst);
        if (chLimits?.messagesPerSecond) {
            st.perCh ??= {};
            const ch = (st.perCh[packet.channel] ??= {});
            ch.msgs ??= makeBucket(chLimits.messagesPerSecond, burst);
            if (!allow(ch.msgs, 1)) return { ok: false, kind: 'messages' };
        } else if (st.msgs && !allow(st.msgs, 1)) {
            return { ok: false, kind: 'messages' };
        }

        // bytes bucket (global or per-channel)
        if (
            (limits.bytesPerSecond || chLimits?.bytesPerSecond) &&
            !st.bytes &&
            limits.bytesPerSecond
        )
            st.bytes = makeBucket(limits.bytesPerSecond, burst);
        if (chLimits?.bytesPerSecond) {
            st.perCh ??= {};
            const ch = (st.perCh[packet.channel] ??= {});
            ch.bytes ??= makeBucket(chLimits.bytesPerSecond, burst);
            if (!allow(ch.bytes, Math.max(1, sizeBytes)))
                return { ok: false, kind: 'bytes' };
        } else if (st.bytes && !allow(st.bytes, Math.max(1, sizeBytes))) {
            return { ok: false, kind: 'bytes' };
        }

        return { ok: true };
    }
}
