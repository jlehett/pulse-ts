import type { Transport, TransportStatus } from '../../domain/types';

type WebSocketCtor = new (
    url: string | URL,
    protocols?: string | string[],
) => WebSocketLike;

type WebSocketLike = {
    readonly readyState: number;
    readonly url: string;
    binaryType: 'arraybuffer' | 'blob';
    onopen: ((ev: any) => any) | null;
    onclose: ((ev: any) => any) | null;
    onerror: ((ev: any) => any) | null;
    onmessage: ((ev: { data: any }) => any) | null;
    close(code?: number, reason?: string): void;
    send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void;
};

/**
 * WebSocket-based transport for browser/Node (pass a ctor for Node).
 *
 * Usage:
 * - Browser: `new WebSocketTransport('wss://...', { autoReconnect: true })`
 * - Node: `new WebSocketTransport(url, { ws: require('ws') })`
 */
export class WebSocketTransport implements Transport {
    readonly kind = 'ws';
    readonly supportsBinary = true;

    private status: TransportStatus = 'idle';
    private msgHandlers = new Set<
        (d: Uint8Array, meta?: { from?: string }) => void
    >();
    private statusHandlers = new Set<(s: TransportStatus) => void>();
    private ws: WebSocketLike | null = null;
    private reconnectAttempts = 0;

    /**
     * @param url WebSocket URL.
     * @param opts Transport options, including optional WebSocket constructor for Node,
     *             autoReconnect, and backoff parameters.
     */
    constructor(
        private url: string,
        private opts: {
            protocols?: string | string[];
            /** Provide a WebSocket constructor for Node environments. */
            ws?: WebSocketCtor;
            /** Enable simple exponential backoff auto-reconnect. */
            autoReconnect?: boolean;
            /** Backoff options in milliseconds. */
            backoff?: { initialMs?: number; maxMs?: number; factor?: number };
        } = {},
    ) {}

    /** Current connection status. */
    getStatus(): TransportStatus {
        return this.status;
    }

    /** Establishes the WebSocket connection. */
    async connect(): Promise<void> {
        if (this.ws) {
            if (this.status === 'open') return;
            this.cleanup(false);
        }
        this.setStatus('connecting');

        const Ctor: WebSocketCtor | undefined =
            this.opts.ws ??
            (typeof (globalThis as any).WebSocket !== 'undefined'
                ? ((globalThis as any).WebSocket as any)
                : undefined);
        if (!Ctor)
            throw new Error(
                'WebSocket constructor not available; pass opts.ws',
            );

        const ws = new Ctor(this.url, this.opts.protocols);
        ws.binaryType = 'arraybuffer';
        ws.onopen = () => this.setStatus('open');
        ws.onclose = () => {
            this.setStatus('closed');
            if (this.opts.autoReconnect) this.scheduleReconnect();
        };
        ws.onerror = () => this.setStatus('error');
        ws.onmessage = (ev: { data: any }) => this.handleMessage(ev.data);
        this.ws = ws;
    }

    /** Closes the connection and cancels reconnect attempts. */
    async disconnect(code?: number, reason?: string): Promise<void> {
        this.opts.autoReconnect = false;
        if (!this.ws) return;
        try {
            this.ws.close(code, reason);
        } finally {
            this.cleanup(true);
        }
    }

    /** Sends a binary frame over the WebSocket. */
    send(data: Uint8Array): void {
        if (!this.ws) return;
        try {
            // Ensure we send the underlying ArrayBuffer without copying when possible
            if (
                data.byteOffset === 0 &&
                data.byteLength === data.buffer.byteLength
            ) {
                this.ws.send(data.buffer);
            } else {
                this.ws.send(data.slice().buffer);
            }
        } catch {
            // If send throws (e.g., not OPEN), ignore; caller will retry next tick
        }
    }

    /**
     * Subscribes to raw incoming frames.
     * @param fn Callback invoked with bytes; `meta.from` is undefined for WS.
     * @returns Unsubscribe function.
     */
    onMessage(fn: (data: Uint8Array, meta?: { from?: string }) => void) {
        this.msgHandlers.add(fn);
        return () => this.msgHandlers.delete(fn);
    }

    /**
     * Subscribes to status changes.
     * @param fn Callback invoked on status update.
     * @returns Unsubscribe function.
     */
    onStatus(fn: (status: TransportStatus) => void) {
        this.statusHandlers.add(fn);
        return () => this.statusHandlers.delete(fn);
    }

    private handleMessage(data: any) {
        // Normalize into Uint8Array
        if (typeof data === 'string') {
            const enc = new TextEncoder();
            this.emitMessage(enc.encode(data));
        } else if (data instanceof ArrayBuffer) {
            this.emitMessage(new Uint8Array(data));
        } else if (ArrayBuffer.isView(data)) {
            const view = data as ArrayBufferView;
            this.emitMessage(
                new Uint8Array(view.buffer, view.byteOffset, view.byteLength),
            );
        } else if (
            typeof (globalThis as any).Blob !== 'undefined' &&
            data instanceof (globalThis as any).Blob
        ) {
            // Browser Blob path
            (data as Blob)
                .arrayBuffer()
                .then((ab) => this.emitMessage(new Uint8Array(ab)))
                .catch(() => {});
        }
    }

    private scheduleReconnect() {
        const {
            initialMs = 250,
            maxMs = 5000,
            factor = 2,
        } = this.opts.backoff ?? {};
        const attempt = this.reconnectAttempts++;
        const delay = Math.min(maxMs, initialMs * Math.pow(factor, attempt));
        setTimeout(() => {
            if (!this.opts.autoReconnect) return;
            this.connect().catch(() => this.scheduleReconnect());
        }, delay);
    }

    private setStatus(s: TransportStatus) {
        this.status = s;
        for (const cb of this.statusHandlers) cb(s);
    }

    private emitMessage(d: Uint8Array) {
        for (const cb of this.msgHandlers) cb(d);
    }

    private cleanup(clearWs: boolean) {
        if (clearWs && this.ws) {
            this.ws.onopen =
                this.ws.onclose =
                this.ws.onerror =
                this.ws.onmessage =
                    null;
            this.ws = null;
        }
    }
}
