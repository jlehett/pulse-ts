import type { Transport, TransportStatus } from '../../../domain/types';

/**
 * Transport wrapping a single RTCDataChannel for 1v1 P2P communication.
 *
 * Unlike {@link WebRtcMeshTransport}, this transport assumes the
 * RTCPeerConnection and DataChannel are already established (e.g., during
 * a lobby/signaling phase). It simply wraps the open channel as a
 * {@link Transport} for use with the engine's networking hooks.
 *
 * @example
 * ```ts
 * const transport = new DataChannelTransport(dataChannel, peerConnection);
 * useConnection(transport);
 * ```
 */
export class DataChannelTransport implements Transport {
    readonly kind = 'datachannel';
    readonly supportsBinary = true;

    private status: TransportStatus = 'idle';
    private msgHandlers = new Set<
        (d: Uint8Array, meta?: { from?: string }) => void
    >();
    private statusHandlers = new Set<(s: TransportStatus) => void>();
    private peerJoinHandlers = new Set<(id: string) => void>();
    private peerLeaveHandlers = new Set<(id: string) => void>();

    private peerId: string;

    /**
     * @param dc - An RTCDataChannel (may be open or still connecting).
     * @param pc - The owning RTCPeerConnection, closed on disconnect.
     * @param peerId - Stable identifier for the remote peer (defaults to 'peer').
     */
    constructor(
        private dc: RTCDataChannel,
        private pc: RTCPeerConnection,
        peerId?: string,
    ) {
        this.peerId = peerId ?? 'peer';
    }

    /** Current transport status. */
    getStatus(): TransportStatus {
        return this.status;
    }

    /**
     * Wire up the DataChannel events and transition to 'open'.
     * If the channel is already open, fires immediately.
     */
    async connect(): Promise<void> {
        if (this.status === 'open') return;
        this.setStatus('connecting');

        this.dc.binaryType = 'arraybuffer';

        this.dc.onmessage = (ev) => this.handleMessage(ev.data);

        this.dc.onclose = () => {
            this.setStatus('closed');
            for (const cb of this.peerLeaveHandlers) cb(this.peerId);
        };

        this.dc.onerror = () => {
            this.setStatus('error');
        };

        this.pc.onconnectionstatechange = () => {
            const state = this.pc.connectionState;
            if (state === 'failed' || state === 'disconnected') {
                this.setStatus('closed');
                for (const cb of this.peerLeaveHandlers) cb(this.peerId);
            }
        };

        if (this.dc.readyState === 'open') {
            this.setStatus('open');
            for (const cb of this.peerJoinHandlers) cb(this.peerId);
        } else {
            this.dc.onopen = () => {
                this.setStatus('open');
                for (const cb of this.peerJoinHandlers) cb(this.peerId);
            };
        }
    }

    /** Close the DataChannel and PeerConnection. */
    async disconnect(): Promise<void> {
        try {
            this.dc.close();
        } catch {
            /* already closed */
        }
        try {
            this.pc.close();
        } catch {
            /* already closed */
        }
        this.setStatus('closed');
    }

    /** Send binary data over the DataChannel. */
    send(data: Uint8Array): void {
        if (this.dc.readyState !== 'open') return;
        try {
            if (
                data.byteOffset === 0 &&
                data.byteLength === data.buffer.byteLength
            ) {
                this.dc.send(data.buffer as ArrayBuffer);
            } else {
                this.dc.send(data.slice().buffer as ArrayBuffer);
            }
        } catch {
            // Channel not ready; caller retries next tick
        }
    }

    /**
     * Subscribe to incoming binary messages.
     *
     * @param fn - Handler receiving bytes and optional peer metadata.
     * @returns Unsubscribe function.
     */
    onMessage(fn: (data: Uint8Array, meta?: { from?: string }) => void) {
        this.msgHandlers.add(fn);
        return () => this.msgHandlers.delete(fn);
    }

    /**
     * Subscribe to transport status changes.
     *
     * @param fn - Handler receiving the new status.
     * @returns Unsubscribe function.
     */
    onStatus(fn: (status: TransportStatus) => void) {
        this.statusHandlers.add(fn);
        return () => this.statusHandlers.delete(fn);
    }

    /**
     * Subscribe to peer join events (DataChannel open).
     *
     * @param fn - Handler receiving the peer id.
     * @returns Unsubscribe function.
     */
    onPeerJoin(fn: (peerId: string) => void) {
        this.peerJoinHandlers.add(fn);
        return () => this.peerJoinHandlers.delete(fn);
    }

    /**
     * Subscribe to peer leave events (DataChannel close).
     *
     * @param fn - Handler receiving the peer id.
     * @returns Unsubscribe function.
     */
    onPeerLeave(fn: (peerId: string) => void) {
        this.peerLeaveHandlers.add(fn);
        return () => this.peerLeaveHandlers.delete(fn);
    }

    /** Returns the single peer id if connected, empty array otherwise. */
    peers(): string[] {
        return this.dc.readyState === 'open' ? [this.peerId] : [];
    }

    private setStatus(s: TransportStatus) {
        this.status = s;
        for (const cb of this.statusHandlers) cb(s);
    }

    private handleMessage(data: unknown) {
        if (data instanceof ArrayBuffer) {
            this.emitMessage(new Uint8Array(data));
        } else if (ArrayBuffer.isView(data)) {
            const view = data as ArrayBufferView;
            this.emitMessage(
                new Uint8Array(view.buffer, view.byteOffset, view.byteLength),
            );
        } else if (typeof data === 'string') {
            this.emitMessage(new TextEncoder().encode(data));
        }
    }

    private emitMessage(d: Uint8Array) {
        for (const cb of this.msgHandlers) cb(d, { from: this.peerId });
    }
}
