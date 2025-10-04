import type { Transport, TransportStatus } from '../../domain/types';

type WebRTC = typeof RTCPeerConnection;

export type WebRtcMeshOptions = {
    /** This peer's stable id. */
    selfId: string;
    /** STUN/TURN config. */
    iceServers?: RTCIceServer[];
    /** Signaling adapter (transport-agnostic). */
    signaling: {
        /** Send a signaling envelope to a peer. */
        send: (
            to: string,
            type: 'hello' | 'offer' | 'answer' | 'ice',
            payload: any,
        ) => void | Promise<void>;
        /** Subscribe to incoming signaling envelopes. */
        on: (
            fn: (env: {
                from: string;
                to: string;
                type: string;
                payload: any;
            }) => void,
        ) => () => void;
        /** Optional: list of known peers to proactively connect to. */
        peers?: () => string[];
    };
    /** Provide WebRTC constructors in non-browser environments. */
    webRTC?: {
        RTCPeerConnection: WebRTC;
        RTCSessionDescription?: any;
        RTCIceCandidate?: any;
    };
};

/**
 * Experimental WebRTC mesh transport (skeleton). Broadcasts to all connected peers.
 *
 * Notes:
 * - Requires an out-of-band signaling adapter.
 * - Emits meta.from per message.
 */
export class WebRtcMeshTransport implements Transport {
    readonly kind = 'webrtc-mesh';
    readonly supportsBinary = true;

    private status: TransportStatus = 'idle';
    private msgHandlers = new Set<
        (d: Uint8Array, meta?: { from?: string }) => void
    >();
    private statusHandlers = new Set<(s: TransportStatus) => void>();
    private peerJoinHandlers = new Set<(id: string) => void>();
    private peerLeaveHandlers = new Set<(id: string) => void>();

    private dcs = new Map<string, RTCDataChannel>();
    private pcs = new Map<string, RTCPeerConnection>();
    private unsubSignal: (() => void) | null = null;

    private RTCPeerConnection: WebRTC;

    /**
     * @param opts Mesh options including `selfId`, `signaling`, and `iceServers`.
     */
    constructor(private opts: WebRtcMeshOptions) {
        this.RTCPeerConnection =
            opts.webRTC?.RTCPeerConnection ??
            (globalThis as any).RTCPeerConnection;
        if (!this.RTCPeerConnection) {
            throw new Error(
                'WebRTC not available; provide opts.webRTC.RTCPeerConnection',
            );
        }
    }

    /** Current connection status of the mesh signaling. */
    getStatus(): TransportStatus {
        return this.status;
    }

    /** Connects signaling and starts establishing peer connections. */
    async connect(): Promise<void> {
        if (this.status === 'open') return;
        this.setStatus('connecting');
        // Listen for signaling messages
        this.unsubSignal = this.opts.signaling.on(async (env) => {
            const { from, to, type, payload } = env;
            if (to !== this.opts.selfId) return;
            await this.handleSignal(from, type as any, payload);
        });
        // Optionally greet known peers to start offers
        for (const pid of this.opts.signaling.peers?.() ?? []) {
            if (pid === this.opts.selfId) continue;
            this.opts.signaling.send(pid, 'hello', {});
        }
        this.setStatus('open');
    }

    /** Disconnects all peer connections and stops signaling. */
    async disconnect(): Promise<void> {
        this.unsubSignal?.();
        this.unsubSignal = null;
        for (const [, dc] of this.dcs)
            try {
                dc.close();
            } catch {}
        this.dcs.clear();
        this.setStatus('closed');
    }

    /** Broadcasts a binary frame to all open DataChannels. */
    send(data: Uint8Array): void {
        for (const [, dc] of this.dcs) {
            try {
                if (dc.readyState !== 'open') continue;
                if (
                    data.byteOffset === 0 &&
                    data.byteLength === data.buffer.byteLength
                ) {
                    dc.send(data.buffer as ArrayBuffer);
                } else {
                    dc.send(data.slice().buffer as ArrayBuffer);
                }
            } catch {}
        }
    }

    /** Subscribe to messages; meta.from is the peer id. */
    onMessage(fn: (data: Uint8Array, meta?: { from?: string }) => void) {
        this.msgHandlers.add(fn);
        return () => this.msgHandlers.delete(fn);
    }

    /** Subscribe to status changes. */
    onStatus(fn: (status: TransportStatus) => void) {
        this.statusHandlers.add(fn);
        return () => this.statusHandlers.delete(fn);
    }

    /** Subscribe to peer join events (DataChannel open). */
    onPeerJoin(fn: (peerId: string) => void) {
        this.peerJoinHandlers.add(fn);
        return () => this.peerJoinHandlers.delete(fn);
    }

    /** Subscribe to peer leave events (DataChannel close). */
    onPeerLeave(fn: (peerId: string) => void) {
        this.peerLeaveHandlers.add(fn);
        return () => this.peerLeaveHandlers.delete(fn);
    }

    /** Returns current peer ids with an open DataChannel. */
    peers() {
        return Array.from(this.dcs.keys());
    }

    private setStatus(s: TransportStatus) {
        this.status = s;
        for (const cb of this.statusHandlers) cb(s);
    }

    private async handleSignal(
        from: string,
        type: 'hello' | 'offer' | 'answer' | 'ice',
        payload: any,
    ) {
        if (type === 'hello') {
            // Tie-breaker to avoid glare: lower selfId becomes offerer
            const iAmOfferer = this.opts.selfId < from;
            await this.startPeer(from, iAmOfferer);
            return;
        }
        if (!this.pcs.get(from)) await this.startPeer(from, false);
        const pc = this.pcs.get(from)!;
        if (type === 'offer') {
            try {
                await pc.setRemoteDescription(payload);
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                await this.opts.signaling.send(from, 'answer', answer);
            } catch {}
            return;
        }
        if (type === 'answer') {
            try {
                await pc.setRemoteDescription(payload);
            } catch {}
            return;
        }
        if (type === 'ice') {
            try {
                const Ctor =
                    this.opts.webRTC?.RTCIceCandidate ??
                    (globalThis as any).RTCIceCandidate;
                const cand = Ctor ? new Ctor(payload) : payload;
                await pc.addIceCandidate(cand);
            } catch {}
            return;
        }
    }

    private async startPeer(peerId: string, isOfferer: boolean) {
        if (this.pcs.has(peerId)) return;
        const pc = new this.RTCPeerConnection({
            iceServers: this.opts.iceServers,
        });
        this.pcs.set(peerId, pc);
        let dc: RTCDataChannel | undefined = undefined;
        if (isOfferer) {
            dc = pc.createDataChannel('data', { negotiated: false });
            this.wireDataChannel(peerId, dc);
            try {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                await this.opts.signaling.send(peerId, 'offer', offer);
            } catch {}
        } else {
            pc.ondatachannel = (ev) => this.wireDataChannel(peerId, ev.channel);
        }
        pc.onicecandidate = (ev) => {
            if (ev.candidate)
                this.opts.signaling.send(peerId, 'ice', ev.candidate);
        };
        pc.onconnectionstatechange = () => {
            if (
                pc.connectionState === 'failed' ||
                pc.connectionState === 'disconnected'
            ) {
                this.dcs.delete(peerId);
                this.pcs.delete(peerId);
            }
        };
        // Store a placeholder channel to reserve the slot
        // Real channel will be set once open
        this.dcs.set(peerId, dc ?? ({} as any));
    }

    private wireDataChannel(peerId: string, dc: RTCDataChannel) {
        dc.binaryType = 'arraybuffer';
        dc.onopen = () => {
            const firstOpen = !this.dcs.has(peerId);
            this.dcs.set(peerId, dc);
            if (firstOpen) for (const cb of this.peerJoinHandlers) cb(peerId);
        };
        dc.onmessage = (ev) => {
            const data = ev.data;
            if (typeof data === 'string') {
                const enc = new TextEncoder();
                for (const cb of this.msgHandlers)
                    cb(enc.encode(data), { from: peerId });
            } else if (data instanceof ArrayBuffer) {
                const bytes = new Uint8Array(data);
                for (const cb of this.msgHandlers) cb(bytes, { from: peerId });
            } else if (ArrayBuffer.isView(data)) {
                const view = data as ArrayBufferView;
                const bytes = new Uint8Array(
                    view.buffer,
                    view.byteOffset,
                    view.byteLength,
                );
                for (const cb of this.msgHandlers) cb(bytes, { from: peerId });
            }
        };
        dc.onclose = () => {
            const had = this.dcs.delete(peerId);
            if (had) for (const cb of this.peerLeaveHandlers) cb(peerId);
        };
    }
}
