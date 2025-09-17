/**
 * The status of a transport.
 */
export type TransportStatus =
    | 'idle'
    | 'connecting'
    | 'open'
    | 'closed'
    | 'error';

/**
 * Low-level transport deals only in bytes; higher layers handle encoding.
 */
export interface Transport {
    /**
     * The kind of transport.
     */
    readonly kind: string;
    /**
     * Whether the transport supports binary.
     */
    readonly supportsBinary: boolean;
    /**
     * Get the status of the transport.
     * @returns The status.
     */
    getStatus(): TransportStatus;
    /**
     * Connect to the transport.
     */
    connect(): Promise<void>;
    /**
     * Disconnect from the transport.
     * @param code The code.
     * @param reason The reason.
     */
    disconnect(code?: number, reason?: string): Promise<void>;
    /**
     * Send a message.
     * @param data The data.
     */
    send(data: Uint8Array): void | Promise<void>;
    /**
     * On message handler.
     * @param fn The handler.
     * @returns The unsubscribe function.
     */
    onMessage(
        fn: (data: Uint8Array, meta?: { from?: string }) => void,
    ): () => void;
    /**
     * On status handler.
     * @param fn The handler.
     * @returns The unsubscribe function.
     */
    onStatus(fn: (status: TransportStatus) => void): () => void;

    /** Optional peer lifecycle (for P2P transports). */
    onPeerJoin?(fn: (peerId: string) => void): () => void;
    onPeerLeave?(fn: (peerId: string) => void): () => void;
    peers?(): string[];
}

/**
 * A packet of data.
 */
export interface Packet<T = unknown> {
    /**
     * The channel of the packet.
     */
    channel: string;
    /**
     * The data of the packet.
     */
    data: T;
    /**
     * Optional metadata (populated if transport can provide it)
     */
    from?: string;
    /**
     * Optional addressing. If present, only the addressed peer(s) should consume.
     */
    to?: string | string[];
}

/**
 * A codec for encoding and decoding packets.
 */
export interface Codec {
    /**
     * Encode a packet.
     * @param packet The packet.
     * @returns The encoded packet.
     */
    encode(packet: Packet): Uint8Array;
    /**
     * Decode a packet.
     * @param bytes The encoded packet.
     * @returns The decoded packet.
     */
    decode(bytes: Uint8Array): Packet;
}

/**
 * A function to unsubscribe from a channel.
 */
export type Unsubscribe = () => void;

/**
 * A handler for a channel.
 * @param data The data.
 * @param meta The meta.
 */
export type ChannelHandler<T = unknown> = (
    data: T,
    meta: { from?: string },
) => void;
