import type { Transport, TransportStatus } from '../../types';
import type { MemoryHub } from './hub';

let peerCounter = 0;

/**
 * A transport for in-memory communication.
 */
export class MemoryTransport implements Transport {
    readonly kind = 'memory';
    readonly supportsBinary = true;

    private status: TransportStatus = 'idle';
    private msgHandlers = new Set<
        (d: Uint8Array, meta?: { from?: string }) => void
    >();
    private statusHandlers = new Set<(s: TransportStatus) => void>();

    constructor(
        private hub: MemoryHub,
        private peerId = `peer-${++peerCounter}`,
    ) {}

    /**
     * Get the status of the transport.
     * @returns The status.
     */
    getStatus(): TransportStatus {
        return this.status;
    }

    /**
     * Connect to the transport.
     */
    async connect(): Promise<void> {
        if (this.status === 'open') return;
        this.setStatus('connecting');
        // simulate async
        await Promise.resolve();
        this.hub.addPeer(this.peerId, {
            id: this.peerId,
            onMessage: (d, meta) => this.emitMessage(d, meta),
            onStatus: (s) => this.setStatus(s),
        });
        this.setStatus('open');
    }

    /**
     * Disconnect from the transport.
     */
    async disconnect(): Promise<void> {
        if (this.status === 'closed') return;
        this.hub.removePeer(this.peerId);
        this.setStatus('closed');
    }

    /**
     * Send a message.
     * @param data The data.
     */
    send(data: Uint8Array): void {
        if (this.status !== 'open') return;
        this.hub.send(this.peerId, data);
    }

    /**
     * On message handler.
     * @param fn The handler.
     * @returns The unsubscribe function.
     */
    onMessage(fn: (data: Uint8Array, meta?: { from?: string }) => void) {
        this.msgHandlers.add(fn);
        return () => this.msgHandlers.delete(fn);
    }

    /**
     * On status handler.
     * @param fn The handler.
     * @returns The unsubscribe function.
     */
    onStatus(fn: (status: TransportStatus) => void) {
        this.statusHandlers.add(fn);
        return () => this.statusHandlers.delete(fn);
    }

    /**
     * Set the status.
     * @param s The status.
     */
    private setStatus(s: TransportStatus) {
        this.status = s;
        for (const cb of this.statusHandlers) cb(s);
    }

    /**
     * Emit a message.
     * @param d The data.
     * @param meta The meta.
     */
    private emitMessage(d: Uint8Array, meta?: { from?: string }) {
        for (const cb of this.msgHandlers) cb(d, meta);
    }
}
