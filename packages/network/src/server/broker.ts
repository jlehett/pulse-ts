import type { Packet } from '../types';

type WsConn = {
    on(event: 'message', cb: (data: any, isBinary?: boolean) => void): void;
    on(event: 'close', cb: (code: number, reason: Buffer) => void): void;
    on(event: 'error', cb: (err: any) => void): void;
    send(data: string | ArrayBufferView | ArrayBufferLike): void;
    close(code?: number, reason?: string): void;
};

type WsServer = {
    on(event: 'connection', cb: (ws: WsConn, req: any) => void): void;
};

type RpcEnvelope =
    | { t: 'req'; id: string; m: string; p: any }
    | { t: 'res'; id: string; r?: any; e?: { message?: string } };

type Peer = {
    id: string;
    ws: WsConn;
    rooms: Set<string>;
};

/**
 * Minimal channel/room broker for WebSocket servers.
 *
 * - Forwards channel packets to peers in the same room(s) (excluding sender).
 * - Handles a reserved `__room` channel with `{ action: 'join'|'leave', room }`.
 * - Optional RPC hosting on `__rpc` channel via registerRpc(name, handler).
 */
export class NetworkServer {
    private peers = new Map<string, Peer>();
    private rooms = new Map<string, Set<string>>();
    private rpc = new Map<
        string,
        (payload: any, peer: Peer) => any | Promise<any>
    >();

    // Channel registry for validation/handlers
    private channels = new Map<
        string,
        {
            validate?: (data: any, peer: { id: string }) => boolean;
            onMessage?: (
                data: any,
                peer: { id: string },
                server: NetworkServer,
            ) => boolean | void; // return true to consume
            route?: (
                data: any,
                peer: { id: string },
            ) => Iterable<string> | null | undefined; // override rooms
        }
    >();

    // Rate limiting per peer and per channel
    private peerLimits = new Map<string, PeerLimitState>();

    constructor(
        private opts: {
            /** Assign a stable peer id. Defaults to incremental. */
            assignId?: (req: any) => string;
            /** Authorize a connection. Throw/return false to reject. */
            authorize?: (req: any) => boolean | Promise<boolean>;
            /** Default room to add new peers to (optional). */
            defaultRoom?: string;
            /** Called when a peer connects. */
            onConnect?: (peer: {
                id: string;
                rooms: ReadonlySet<string>;
            }) => void;
            /** Called when a peer disconnects. */
            onDisconnect?: (peerId: string) => void;
            /** Rate limits config. */
            limits?: RateLimits;
            /** Max rooms a single peer may be in (drops join beyond this). */
            maxRoomsPerPeer?: number;
        } = {},
    ) {}

    /** Binds a ws server (from the 'ws' package) to this broker. */
    attachWebSocketServer(wss: WsServer) {
        wss.on('connection', async (ws: WsConn, req: any) => {
            try {
                if (this.opts.authorize) {
                    const ok = await this.opts.authorize(req);
                    if (!ok) return ws.close(1008, 'Unauthorized');
                }
            } catch (e) {
                return ws.close(1011, 'Auth error');
            }
            const id = this.opts.assignId?.(req) ?? this.nextId();
            const peer: Peer = { id, ws, rooms: new Set() };
            this.peers.set(id, peer);
            if (this.opts.defaultRoom) this.joinRoom(id, this.opts.defaultRoom);
            this.opts.onConnect?.({ id, rooms: peer.rooms });

            ws.on('message', (data: any) => this.handleMessage(peer, data));
            ws.on('close', () => this.removePeer(id));
            ws.on('error', () => this.removePeer(id));
        });
    }

    /** Registers a room membership. */
    joinRoom(peerId: string, room: string) {
        const p = this.peers.get(peerId);
        if (!p) return;
        if (
            this.opts.maxRoomsPerPeer &&
            p.rooms.size >= this.opts.maxRoomsPerPeer
        )
            return;
        p.rooms.add(room);
        (
            this.rooms.get(room) ?? this.rooms.set(room, new Set()).get(room)!
        ).add(peerId);
    }

    /** Removes a peer from a room. */
    leaveRoom(peerId: string, room: string) {
        const p = this.peers.get(peerId);
        if (!p) return;
        p.rooms.delete(room);
        const set = this.rooms.get(room);
        set?.delete(peerId);
        if (set && set.size === 0) this.rooms.delete(room);
    }

    /** Registers channel validation and/or a server-side handler. */
    registerChannel(
        name: string,
        opts: {
            /** Predicate that must return true for the packet to be accepted. */
            validate?: (data: any, peer: { id: string }) => boolean;
            /** If provided and returns true, the packet is consumed and not forwarded. */
            onMessage?: (
                data: any,
                peer: { id: string },
                server: NetworkServer,
            ) => boolean | void;
            /** Override routing rooms; return null/undefined to use peer.rooms. */
            route?: (
                data: any,
                peer: { id: string },
            ) => Iterable<string> | null | undefined;
        },
    ) {
        this.channels.set(name, opts);
        return () => this.channels.delete(name);
    }

    /** Lists peers currently in a room. */
    peersInRoom(room: string): string[] {
        return [...(this.rooms.get(room) ?? [])];
    }

    /** Returns rooms for a given peer. */
    roomsForPeer(peerId: string): string[] {
        const p = this.peers.get(peerId);
        return p ? [...p.rooms] : [];
    }

    /** Lists all room names. */
    listRooms(): string[] {
        return [...this.rooms.keys()];
    }

    /** Lists all peer ids. */
    listPeers(): string[] {
        return [...this.peers.keys()];
    }

    /** Disconnects a peer. */
    disconnect(peerId: string, code?: number, reason?: string) {
        const p = this.peers.get(peerId);
        p?.ws.close(code, reason);
        this.removePeer(peerId);
    }

    /** Class-private rate limit check. */
    private allow(peerId: string, packet: Packet, sizeBytes: number): boolean {
        const limits = this.opts?.limits as RateLimits | undefined;
        if (!limits) return true;
        const burst = limits.burstMultiplier ?? 2;
        let st = this.peerLimits.get(peerId);
        if (!st) {
            st = {};
            this.peerLimits.set(peerId, st);
        }
        const chLimits = limits.perChannel?.[packet.channel];
        // messages bucket
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
            if (!allow(ch.msgs, 1))
                return handleLimit(this, peerId, packet.channel, 'messages');
        } else if (st.msgs && !allow(st.msgs, 1)) {
            return handleLimit(this, peerId, packet.channel, 'messages');
        }
        // bytes bucket
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
                return handleLimit(this, peerId, packet.channel, 'bytes');
        } else if (st.bytes && !allow(st.bytes, Math.max(1, sizeBytes))) {
            return handleLimit(this, peerId, packet.channel, 'bytes');
        }
        return true;
    }

    /** Registers an RPC handler hosted by the server. */
    registerRpc(
        name: string,
        fn: (payload: any, peer: { id: string }) => any | Promise<any>,
    ) {
        this.rpc.set(name, fn as any);
        return () => this.rpc.delete(name);
    }

    /** Sends a packet to all peers in given room(s) except an optional excluded peer. */
    broadcast(packet: Packet, rooms?: Iterable<string>, exceptId?: string) {
        const sent = new Set<string>();
        const targets = new Set<string>();
        if (rooms)
            for (const r of rooms)
                this.rooms.get(r)?.forEach((id) => targets.add(id));
        else this.peers.forEach((_, id) => targets.add(id));
        if (exceptId) targets.delete(exceptId);
        const payload = JSON.stringify(packet);
        for (const id of targets) {
            if (sent.has(id)) continue;
            sent.add(id);
            const p = this.peers.get(id);
            p?.ws.send(payload);
        }
    }

    private removePeer(id: string) {
        const p = this.peers.get(id);
        if (!p) return;
        for (const r of p.rooms) this.leaveRoom(id, r);
        this.peers.delete(id);
        this.opts.onDisconnect?.(id);
    }

    private handleMessage(peer: Peer, data: any) {
        let packet: Packet | null = null;
        try {
            if (typeof data === 'string') packet = JSON.parse(data);
            else if (data instanceof Buffer)
                packet = JSON.parse(data.toString());
            else if (ArrayBuffer.isView(data))
                packet = JSON.parse(Buffer.from(data.buffer).toString());
        } catch {
            return; // drop malformed
        }
        if (!packet || typeof packet !== 'object') return;
        if (!('channel' in packet)) return;

        // Rate limit
        const size =
            typeof data === 'string'
                ? Buffer.byteLength(data)
                : (data?.length ?? 0);
        if (!this.allow(peer.id, packet, size)) {
            return;
        }

        // Reserved channels
        if (packet.channel === '__room') {
            const act = (packet as any).data?.action;
            const room = (packet as any).data?.room as string;
            if (typeof room === 'string' && room) {
                if (act === 'join') this.joinRoom(peer.id, room);
                else if (act === 'leave') this.leaveRoom(peer.id, room);
            }
            return;
        }
        if (packet.channel === '__clock') {
            const env = (packet as any).data as {
                t: 'ping' | 'pong';
                id: string;
                cSendMs?: number;
            };
            if (env && env.t === 'ping' && typeof env.id === 'string') {
                this.unicast(peer.id, {
                    channel: '__clock',
                    data: { t: 'pong', id: env.id, sNowMs: Date.now() } as any,
                });
            }
            return;
        }
        if (packet.channel === '__rpc') {
            const env = (packet as any).data as RpcEnvelope;
            if (env && env.t === 'req' && env.m && this.rpc.has(env.m)) {
                const fn = this.rpc.get(env.m)!;
                Promise.resolve()
                    .then(() => fn(env.p, peer))
                    .then((r) =>
                        this.unicast(peer.id, {
                            channel: '__rpc',
                            data: { t: 'res', id: env.id, r },
                        }),
                    )
                    .catch((e) =>
                        this.unicast(peer.id, {
                            channel: '__rpc',
                            data: {
                                t: 'res',
                                id: env.id,
                                e: { message: e?.message ?? String(e) },
                            },
                        }),
                    );
                return;
            }
            // Unknown RPC method; drop or forward? We'll drop by default.
            return;
        }

        // Reliable request/ack channel
        if (packet.channel === '__rel') {
            const env = (packet as any).data as {
                t: 'req' | 'ack';
                id: string;
                topic?: string;
                payload?: any;
            };
            if (!env || env.t !== 'req' || typeof env.id !== 'string') return;
            const topic = (env as any).topic as string;
            const handlers = (this as any)._relHandlers as Map<
                string,
                (payload: any, peer: { id: string }) => any | Promise<any>
            > as any;
            const seen = ((this as any)._relSeen ??= new Map()) as Map<
                string,
                Map<string, any>
            >;
            const per =
                seen.get(peer.id) ??
                (seen.set(peer.id, new Map()), seen.get(peer.id)!);
            // dedupe by id
            if (per.has(env.id)) {
                const ack = per.get(env.id);
                this.unicast(peer.id, { channel: '__rel', data: ack });
                return;
            }
            const srvSeq =
                (((this as any)._relSeq ??= new Map()).get(peer.id) ?? 0) + 1;
            ((this as any)._relSeq as Map<string, number>).set(peer.id, srvSeq);
            const fn = handlers?.get?.(topic);
            if (!fn) {
                const ack = {
                    t: 'ack',
                    id: env.id,
                    status: 'error',
                    reason: 'unknown_topic',
                    srvSeq,
                };
                per.set(env.id, ack);
                this.unicast(peer.id, { channel: '__rel', data: ack });
                this.trimRel(per);
                return;
            }
            Promise.resolve()
                .then(() => fn(env.payload, peer))
                .then((result) => {
                    const ack = {
                        t: 'ack',
                        id: env.id,
                        status: 'ok',
                        result,
                        srvSeq,
                    };
                    per.set(env.id, ack);
                    this.unicast(peer.id, { channel: '__rel', data: ack });
                    this.trimRel(per);
                })
                .catch((e) => {
                    const ack = {
                        t: 'ack',
                        id: env.id,
                        status: 'error',
                        reason: e?.message ?? String(e),
                        srvSeq,
                    };
                    per.set(env.id, ack);
                    this.unicast(peer.id, { channel: '__rel', data: ack });
                    this.trimRel(per);
                });
            return;
        }

        // Channel registry hooks
        const reg = this.channels.get(packet.channel);
        if (
            reg?.validate &&
            !safeTrue(() => reg!.validate!(packet!.data, peer))
        )
            return;
        if (reg?.onMessage) {
            const consumed = safeTrue(() =>
                reg!.onMessage!(packet!.data, peer, this),
            );
            if (consumed) return;
        }

        // Regular channel: forward to peers sharing any rooms with sender; or custom route
        const routeRooms =
            reg?.route?.(packet.data, peer) ??
            (peer.rooms.size ? peer.rooms : undefined);
        this.broadcast(packet, routeRooms ?? undefined, peer.id);
    }

    private unicast(peerId: string, packet: Packet) {
        const p = this.peers.get(peerId);
        if (!p) return;
        try {
            p.ws.send(JSON.stringify(packet));
        } catch {}
    }

    /** Registers a reliable request handler for a given topic. */
    registerReliable(
        topic: string,
        fn: (payload: any, peer: { id: string }) => any | Promise<any>,
    ) {
        const handlers = ((this as any)._relHandlers ??= new Map()) as Map<
            string,
            (payload: any, peer: { id: string }) => any | Promise<any>
        >;
        handlers.set(topic, fn);
        return () => handlers.delete(topic);
    }

    private trimRel(per: Map<string, any>) {
        const MAX = 1000;
        if (per.size <= MAX) return;
        const it = per.keys();
        const first = it.next();
        if (!first.done) per.delete(first.value);
    }

    private _id = 0;
    private nextId() {
        return `peer-${++this._id}`;
    }
}

// ---------------- Rate limiting ----------------

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
    /** When a peer exceeds limits: drop (default) or disconnect. */
    disconnectOnAbuse?: boolean;
    /** Callback when a peer is rate limited. */
    onLimitExceeded?: (
        peerId: string,
        info: { channel: string; kind: 'messages' | 'bytes' },
    ) => void;
}

type Bucket = {
    tokens: number;
    capacity: number;
    refillPerSec: number;
    last: number;
};
type PeerLimitState = {
    msgs?: Bucket;
    bytes?: Bucket;
    perCh?: Record<string, { msgs?: Bucket; bytes?: Bucket }>;
};

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

function safeTrue(fn: () => any) {
    try {
        return !!fn();
    } catch {
        return false;
    }
}

function handleLimit(
    server: NetworkServer,
    peerId: string,
    channel: string,
    kind: 'messages' | 'bytes',
) {
    const o = (server as any)['opts'] as { limits?: RateLimits } | undefined;
    o?.limits?.onLimitExceeded?.(peerId, { channel, kind });
    if (o?.limits?.disconnectOnAbuse)
        server.disconnect(peerId, 1008, 'rate limited');
    return false;
}

/**
 * Attaches a Node 'ws' WebSocketServer to a NetworkServer.
 *
 * Example:
 * const { WebSocketServer } = require('ws');
 * const wss = new WebSocketServer({ port: 8080 });
 * const server = attachWsServer(wss, { defaultRoom: 'lobby' });
 */
export function attachWsServer(
    wss: WsServer,
    opts?: ConstructorParameters<typeof NetworkServer>[0],
) {
    const srv = new NetworkServer(opts);
    srv.attachWebSocketServer(wss);
    return srv;
}
