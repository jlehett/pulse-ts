import type { Packet } from '../../../domain/types';
import { ReservedChannels } from '../../../domain/messaging/reserved';
import type { RateLimits } from '../features/rateLimit';
import { RateLimiter } from '../features/rateLimit';
import {
    handleRpcMessage,
    type RpcHandler,
    type RpcEnvelope,
} from '../features/rpc';
import { handleRoomMessage } from '../features/rooms';
import { decodePacket, encodePacket } from '../io/packets';
import { handleReliableRequest } from '../features/reliable';
import { ChannelRegistry, type ChannelOptions } from '../routing/channels';
import { PeerManager } from '../peers/peers';
import { handleRegisteredChannel } from '../routing/routing';

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

    /**
     * @param opts Server configuration and hooks.
     * @param opts.assignId Assign a stable peer id. Defaults to incremental.
     * @param opts.authorize Authorize a connection; return false or throw to reject.
     * @param opts.defaultRoom Optional room to auto-join on connect.
     * @param opts.onConnect Callback on peer connect.
     * @param opts.onDisconnect Callback on peer disconnect.
     * @param opts.limits Optional rate limits configuration.
     * @param opts.maxRoomsPerPeer Max rooms a single peer may join.
     */
    constructor(
        private opts: {
            assignId?: (req: any) => string;
            authorize?: (req: any) => boolean | Promise<boolean>;
            defaultRoom?: string;
            onConnect?: (peer: {
                id: string;
                rooms: ReadonlySet<string>;
            }) => void;
            onDisconnect?: (peerId: string) => void;
            limits?: RateLimits;
            maxRoomsPerPeer?: number;
        } = {},
    ) {
        if (this.opts?.limits)
            this.rateLimiter = new RateLimiter(this.opts.limits);
    }

    /**
     * Binds a ws server (from the 'ws' package) to this broker.
     * @param wss WebSocketServer instance from 'ws'.
     */
    attachWebSocketServer(wss: WsServer) {
        wss.on('connection', async (ws: WsConn, req: any) => {
            try {
                if (this.opts.authorize) {
                    const ok = await this.opts.authorize(req);
                    if (!ok) return ws.close(1008, 'Unauthorized');
                }
            } catch {
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

        //#region Rate Limiting

        const size =
            typeof data === 'string'
                ? Buffer.byteLength(data)
                : (data?.length ?? 0);
        if (!this.allow(peer.id, packet, size)) {
            return;
        }

        //#endregion

        //#region Reserved Channel Routing

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
        if (packet.channel === ReservedChannels.SIGNAL) {
            const env = (packet as any).data as {
                to?: string;
                from?: string;
                type: string;
                payload: any;
            };
            const to = env?.to;
            if (typeof to === 'string' && to) {
                // ensure from is set
                env.from ??= peer.id;
                this.unicast(to, {
                    channel: ReservedChannels.SIGNAL,
                    data: env,
                });
            }
            return;
        }
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

        //#endregion

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
            p.ws.send(encodePacket(packet));
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
