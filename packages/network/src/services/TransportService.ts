import { Service } from '@pulse-ts/core';
import { TypedEvent } from '@pulse-ts/core';
import type {
    Codec,
    Packet,
    Transport,
    TransportStatus,
    ChannelHandler,
    Unsubscribe,
} from '../types';
import { JSON_CODEC } from '../messaging/codec';
import { channelKey, ChannelName } from '../messaging/channel';

/**
 * A service for transporting messages between nodes.
 */
export class TransportService extends Service {
    private codec: Codec;
    private transport: Transport | null = null;
    private status: TransportStatus = 'idle';
    private selfId?: string;

    private inbox: Packet[] = [];
    private outbox: Packet[] = [];

    private subs = new Map<string, Set<ChannelHandler<any>>>();

    // Events for observability
    readonly onStatus = new TypedEvent<TransportStatus>();
    readonly onPacketIn = new TypedEvent<Packet>();
    readonly onPacketOut = new TypedEvent<Packet>();
    readonly onPeerJoin = new TypedEvent<string>();
    readonly onPeerLeave = new TypedEvent<string>();

    // Basic stats
    private bytesIn = 0;
    private bytesOut = 0;
    private packetsIn = 0;
    private packetsOut = 0;

    constructor(opts: { codec?: Codec; selfId?: string } = {}) {
        super();
        this.codec = opts.codec ?? JSON_CODEC;
        this.selfId = opts.selfId;
    }

    /**
     * Replaces the packet codec used for encode/decode.
     */
    setCodec(codec: Codec) {
        this.codec = codec;
    }

    /** Sets this client's peer id for addressed packet filtering. */
    setSelfId(id: string) {
        this.selfId = id;
    }

    /** Returns the configured peer id, if any. */
    getSelfId() {
        return this.selfId;
    }

    /**
     * Set the transport.
     * @param t The transport.
     */
    setTransport(t: Transport) {
        if (this.transport) this.detachTransport();
        this.transport = t;
        this.status = t.getStatus();
        const offMsg = t.onMessage((bytes, meta) => {
            try {
                const p = this.codec.decode(bytes);
                if (meta?.from) p.from = meta.from;
                this.inbox.push(p);
                this.bytesIn += bytes.byteLength;
                this.packetsIn++;
            } catch (e) {
                console.error('[TransportService] decode error', e);
            }
        });
        const offStatus = t.onStatus((s) => {
            this.status = s;
            this.onStatus.emit(s);
        });
        // Optional peer lifecycle wiring (for P2P transports)
        let offPeerJoin: (() => void) | undefined;
        let offPeerLeave: (() => void) | undefined;
        if (typeof (t as any).onPeerJoin === 'function') {
            offPeerJoin = (t as any).onPeerJoin((id: string) =>
                this.onPeerJoin.emit(id),
            );
        }
        if (typeof (t as any).onPeerLeave === 'function') {
            offPeerLeave = (t as any).onPeerLeave((id: string) =>
                this.onPeerLeave.emit(id),
            );
        }

        // Keep detach function tied to current transport
        (this as any)._offT = () => {
            offMsg();
            offStatus();
            offPeerJoin?.();
            offPeerLeave?.();
        };
    }

    /**
     * Detach the transport.
     */
    private detachTransport() {
        (this as any)._offT?.();
        (this as any)._offT = undefined;
        this.transport = null;
        this.status = 'idle';
    }

    /**
     * Connect to the transport.
     */
    async connect() {
        if (!this.transport)
            throw new Error(
                'TransportService.connect(): no transport set. Provide one with installNetwork(world, { transport }), useConnection(() => new WebSocketTransport(url)), or useMemory(createMemoryHub()).',
            );
        await this.transport.connect();
    }

    /**
     * Disconnect from the transport.
     */
    async disconnect() {
        if (!this.transport) return;
        await this.transport.disconnect();
    }

    /**
     * Get the status of the transport.
     * @returns The status.
     */
    getStatus(): TransportStatus {
        return this.status;
    }

    /**
     * Subscribe to a channel.
     * @param name The name of the channel.
     * @param handler The handler.
     * @returns The unsubscribe function.
     */
    subscribe<T>(name: ChannelName, handler: ChannelHandler<T>): Unsubscribe {
        const key = channelKey(name);
        let set = this.subs.get(key);
        if (!set) this.subs.set(key, (set = new Set()));
        set.add(handler as ChannelHandler<any>);
        return () => set!.delete(handler as ChannelHandler<any>);
    }

    /**
     * Publish a message to a channel.
     * @param name The name of the channel.
     * @param data The data.
     */
    publish<T>(name: ChannelName, data: T) {
        this.outbox.push({ channel: channelKey(name), data });
    }

    /**
     * Publish a message addressed to a specific peer or peers.
     */
    publishTo<T>(name: ChannelName, to: string | string[], data: T) {
        this.outbox.push({ channel: channelKey(name), data, to });
    }

    /**
     * Flush the outgoing messages.
     */
    flushOutgoing() {
        if (!this.transport) return;
        for (const pkt of this.outbox) {
            const bytes = this.codec.encode(pkt);
            this.transport.send(bytes);
            this.bytesOut += bytes.byteLength;
            this.packetsOut++;
            this.onPacketOut.emit(pkt);
        }
        this.outbox.length = 0;
    }

    /**
     * Dispatch the incoming messages.
     * @param max The maximum number of messages to dispatch.
     */
    dispatchIncoming(max = 128) {
        // process up to max msgs per call to avoid long spikes
        let count = 0;
        while (this.inbox.length && count < max) {
            const pkt = this.inbox.shift()!;
            // Addressing filter: if packet has 'to', ensure it includes us
            if (pkt.to) {
                const me = this.selfId;
                if (!me) {
                    // Without self id we can't decide; drop addressed packets
                    count++;
                    continue;
                }
                if (typeof pkt.to === 'string') {
                    if (pkt.to !== me) {
                        count++;
                        continue;
                    }
                } else if (!pkt.to.includes(me)) {
                    count++;
                    continue;
                }
            }
            const set = this.subs.get(pkt.channel);
            this.onPacketIn.emit(pkt);
            if (set && set.size) {
                for (const fn of set) fn(pkt.data, { from: pkt.from });
            }
            count++;
        }
    }

    /**
     * Get the stats.
     * @returns The stats.
     */
    getStats() {
        return {
            status: this.status,
            bytesIn: this.bytesIn,
            bytesOut: this.bytesOut,
            packetsIn: this.packetsIn,
            packetsOut: this.packetsOut,
        };
    }

    /** Current peer ids if supported by transport. */
    getPeers(): string[] {
        const t = this.transport as any;
        if (t?.peers && typeof t.peers === 'function') return t.peers();
        return [];
    }

    /**
     * Fluent typed channel helper.
     */
    channel<T = unknown>(name: ChannelName) {
        const key = channelKey(name);
        return {
            publish: (data: T) => this.publish<T>(key, data),
            publishTo: (to: string | string[], data: T) =>
                this.publishTo<T>(key, to, data),
            subscribe: (fn: ChannelHandler<T>): Unsubscribe =>
                this.subscribe<T>(key, fn),
            once: (fn: ChannelHandler<T>): Unsubscribe => {
                const off = this.subscribe<T>(key, (d, meta) => {
                    off();
                    fn(d, meta);
                });
                return off;
            },
        } as const;
    }
}
