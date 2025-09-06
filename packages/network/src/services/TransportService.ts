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
import { channelKey } from '../messaging/channel';

/**
 * A service for transporting messages between nodes.
 */
export class TransportService extends Service {
    private codec: Codec;
    private transport: Transport | null = null;
    private status: TransportStatus = 'idle';

    private inbox: Packet[] = [];
    private outbox: Packet[] = [];

    private subs = new Map<string, Set<ChannelHandler<any>>>();

    // Events for observability
    readonly onStatus = new TypedEvent<TransportStatus>();
    readonly onPacketIn = new TypedEvent<Packet>();
    readonly onPacketOut = new TypedEvent<Packet>();

    // Basic stats
    private bytesIn = 0;
    private bytesOut = 0;
    private packetsIn = 0;
    private packetsOut = 0;

    constructor(opts: { codec?: Codec } = {}) {
        super();
        this.codec = opts.codec ?? JSON_CODEC;
    }

    /**
     * Replaces the packet codec used for encode/decode.
     */
    setCodec(codec: Codec) {
        this.codec = codec;
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
        // Keep detach function tied to current transport
        (this as any)._offT = () => {
            offMsg();
            offStatus();
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
        if (!this.transport) throw new Error('No transport set');
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
    subscribe<T>(name: string, handler: ChannelHandler<T>): Unsubscribe {
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
    publish<T>(name: string, data: T) {
        this.outbox.push({ channel: channelKey(name), data });
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
}
