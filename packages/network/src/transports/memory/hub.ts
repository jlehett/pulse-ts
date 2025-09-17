import type { TransportStatus } from '../../types';

/**
 * A peer in the memory hub.
 */
type Peer = {
    /**
     * The ID of the peer.
     */
    id: string;
    /**
     * The message handler.
     * @param data The data.
     * @param meta The meta.
     */
    onMessage?: (data: Uint8Array, meta?: { from?: string }) => void;
    /**
     * The status handler.
     * @param s The status.
     */
    onStatus?: (s: TransportStatus) => void;
};

/**
 * In-memory message hub for tests and local simulation.
 * Broadcasts to all peers except sender.
 */
export interface MemoryHub {
    /**
     * The ID of the hub.
     */
    readonly id: string;
    /**
     * Add a peer to the hub.
     * @param peerId The ID of the peer.
     * @param cb The peer.
     */
    addPeer(peerId: string, cb: Peer): void;
    /**
     * Remove a peer from the hub.
     * @param peerId The ID of the peer.
     */
    removePeer(peerId: string): void;
    /**
     * Send a message to a peer.
     * @param from The ID of the sender.
     * @param data The data.
     */
    send(from: string, data: Uint8Array): void;
    /**
     * Get the peers in the hub.
     * @returns The peers.
     */
    peers(): string[];
}

let hubCounter = 0;

/**
 * Create a memory hub.
 * @returns The memory hub.
 */
export function createMemoryHub(): MemoryHub {
    const id = `hub-${++hubCounter}`;
    const peers = new Map<string, Peer>();

    return {
        id,
        /**
         * Add a peer to the hub.
         * @param peerId The ID of the peer.
         * @param cb The peer.
         */
        addPeer(peerId, cb) {
            peers.set(peerId, cb);
            cb.onStatus?.('open');
        },
        /**
         * Remove a peer from the hub.
         * @param peerId The ID of the peer.
         */
        removePeer(peerId) {
            const p = peers.get(peerId);
            if (p) p.onStatus?.('closed');
            peers.delete(peerId);
        },
        /**
         * Send a message to a peer.
         * @param from The ID of the sender.
         * @param data The data.
         */
        send(from, data) {
            for (const [pid, p] of peers) {
                if (pid === from) continue;
                p.onMessage?.(data, { from });
            }
        },
        /**
         * Get the peers in the hub.
         * @returns The peers.
         */
        peers() {
            return [...peers.keys()];
        },
    };
}
