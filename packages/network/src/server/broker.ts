import type { Packet } from '../types';
import { ReservedChannels } from '../messaging/reserved';
import type { RateLimits } from './rateLimit';
import { RateLimiter } from './rateLimit';
import { handleRpcMessage, type RpcHandler, type RpcEnvelope } from './rpc';
import { handleRoomMessage } from './rooms';
import { decodePacket, encodePacket } from './packets';
import { handleReliableRequest } from './reliable';
import { ChannelRegistry, type ChannelOptions } from './channels';
import { PeerManager } from './peers';
import { handleRegisteredChannel } from './routing';

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

/**
 * Minimal channel/room broker for WebSocket servers.
 *
 * - Forwards channel packets to peers in the same room(s) (excluding sender).
 * - Handles a reserved `__room` channel with `{ action: 'join'|'leave', room }`.
 * - Optional RPC hosting on `__rpc` channel via registerRpc(name, handler).
 */
export class NetworkServer {
    private peers = new PeerManager();
    private rpc = new Map<string, RpcHandler>();
    // Reliable channel state (handlers, per-peer dedupe cache, per-peer sequence)
    private relHandlers = new Map<
        string,
        (payload: any, peer: { id: string }) => any | Promise<any>
    >();
    private relSeen = new Map<string, Map<string, any>>();
    private relSeq = new Map<string, number>();

    // Channel registry for validation/handlers
    private channels = new ChannelRegistry();

    // Rate limiting per peer and per channel
    private rateLimiter?: RateLimiter;

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
    ) {
        if (this.opts?.limits)
            this.rateLimiter = new RateLimiter(this.opts.limits);
    }

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
            const peer = this.peers.addPeer(id, ws);
            if (this.opts.defaultRoom) this.joinRoom(id, this.opts.defaultRoom);
            this.opts.onConnect?.({ id, rooms: peer.rooms });

            ws.on('message', (data: any) => this.handleMessage(peer, data));
            ws.on('close', () => this.removePeer(id));
            ws.on('error', () => this.removePeer(id));
        });
    }

    /** Registers a room membership. */
    joinRoom(peerId: string, room: string) {
        return this.peers.joinRoom(peerId, room, {
            maxRoomsPerPeer: this.opts.maxRoomsPerPeer,
        });
    }

    /** Removes a peer from a room. */
    leaveRoom(peerId: string, room: string) {
        return this.peers.leaveRoom(peerId, room);
    }

    /** Registers channel validation and/or a server-side handler. */
    registerChannel(name: string, opts: ChannelOptions) {
        return this.channels.register(name, opts);
    }

    /** Lists peers currently in a room. */
    peersInRoom(room: string): string[] {
        return this.peers.peersInRoom(room);
    }

    /** Returns rooms for a given peer. */
    roomsForPeer(peerId: string): string[] {
        return this.peers.roomsForPeer(peerId);
    }

    /** Lists all room names. */
    listRooms(): string[] {
        return this.peers.listRooms();
    }

    /** Lists all peer ids. */
    listPeers(): string[] {
        return this.peers.listPeers();
    }

    /** Disconnects a peer. */
    disconnect(peerId: string, code?: number, reason?: string) {
        const p = this.peers.getPeer(peerId);
        p?.ws.close(code, reason);
        this.removePeer(peerId);
    }

    /** Class-private rate limit check. */
    private allow(peerId: string, packet: Packet, sizeBytes: number): boolean {
        if (!this.rateLimiter) return true;
        const res = this.rateLimiter.check(peerId, packet, sizeBytes);
        if (res.ok) return true;
        const limits = this.opts.limits;
        limits?.onLimitExceeded?.(peerId, {
            channel: packet.channel,
            kind: res.kind,
        });
        if (limits?.disconnectOnAbuse)
            this.disconnect(peerId, 1008, 'rate limited');
        return false;
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
                this.peers.peersInRoom(r).forEach((id) => targets.add(id));
        else this.peers.listPeers().forEach((id) => targets.add(id));
        if (exceptId) targets.delete(exceptId);
        const payload = encodePacket(packet);
        for (const id of targets) {
            if (sent.has(id)) continue;
            sent.add(id);
            const p = this.peers.getPeer(id);
            p?.ws.send(payload);
        }
    }

    private removePeer(id: string) {
        this.peers.removePeer(id);
        this.opts.onDisconnect?.(id);
    }

    private handleMessage(peer: { id: string; rooms: Set<string> }, data: any) {
        const packet = decodePacket(data);
        if (!packet || typeof packet !== 'object') return; // drop malformed
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
        if (packet.channel === ReservedChannels.ROOM) {
            handleRoomMessage(this, peer.id, (packet as any).data, (id, pkt) =>
                this.unicast(id, pkt),
            );
            return;
        }
        if (packet.channel === ReservedChannels.CLOCK) {
            const env = (packet as any).data as {
                t: 'ping' | 'pong';
                id: string;
                cSendMs?: number;
            };
            if (env && env.t === 'ping' && typeof env.id === 'string') {
                this.unicast(peer.id, {
                    channel: ReservedChannels.CLOCK,
                    data: { t: 'pong', id: env.id, sNowMs: Date.now() } as any,
                });
            }
            return;
        }
        if (packet.channel === ReservedChannels.RPC) {
            const env = (packet as any).data as RpcEnvelope;
            handleRpcMessage(this.rpc, env, peer, (id, pkt) =>
                this.unicast(id, pkt),
            );
            return;
        }

        // Reliable request/ack channel
        if (packet.channel === ReservedChannels.RELIABLE) {
            const env = (packet as any).data as {
                t: 'req' | 'ack';
                id: string;
                topic?: string;
                payload?: any;
            };
            if (!env || env.t !== 'req' || typeof env.id !== 'string') return;
            handleReliableRequest(
                this.relHandlers,
                peer,
                {
                    t: 'req',
                    id: env.id,
                    topic: env.topic as string,
                    payload: env.payload,
                },
                (id, pkt) => this.unicast(id, pkt),
                this.relSeen,
                this.relSeq,
            );
            return;
        }

        // Channel registry hooks and routing
        handleRegisteredChannel(
            this.channels,
            packet,
            peer,
            (pkt, rooms, exceptId) => this.broadcast(pkt, rooms, exceptId),
            this,
        );
    }

    private unicast(peerId: string, packet: Packet) {
        const p = this.peers.getPeer(peerId);
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
        this.relHandlers.set(topic, fn);
        return () => this.relHandlers.delete(topic);
    }

    private _id = 0;
    private nextId() {
        return `peer-${++this._id}`;
    }
}

// ---------------- Utilities ----------------

function safeTrue(fn: () => any) {
    try {
        return !!fn();
    } catch {
        return false;
    }
}
