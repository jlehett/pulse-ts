import { DataChannelTransport } from '@pulse-ts/network/transports/datachannel';

/**
 * Fallback ICE servers (STUN only) used when TURN credentials
 * are unavailable or the signaling server doesn't support them.
 */
const FALLBACK_ICE_SERVERS: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
];

/** Timeout (ms) waiting for WebRTC DataChannel to open. */
const WEBRTC_TIMEOUT = 15000;

/** Timeout (ms) waiting for ICE server credentials from signaling server. */
const ICE_SERVERS_TIMEOUT = 5000;

/**
 * Build the Lambda signaling WebSocket URL.
 * In production, this comes from the Terraform output (API Gateway WebSocket endpoint).
 * For local development, falls back to localhost.
 *
 * @returns The signaling WebSocket URL.
 *
 * @example
 * ```ts
 * const url = getSignalingUrl();
 * const ws = new WebSocket(url);
 * ```
 */
export function getSignalingUrl(): string {
    const envUrl =
        typeof (window as any).__SIGNALING_URL__ === 'string'
            ? (window as any).__SIGNALING_URL__
            : undefined;
    if (envUrl) return envUrl;

    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${proto}//${window.location.host}`;
}

/**
 * Request TURN relay credentials from the signaling server via the
 * `get-ice-servers` action. Falls back to STUN-only if unavailable.
 *
 * @param ws - Open WebSocket to the signaling server.
 * @returns ICE server configuration including TURN credentials.
 *
 * @example
 * ```ts
 * const iceServers = await requestIceServers(ws);
 * ```
 */
export function requestIceServers(ws: WebSocket): Promise<RTCIceServer[]> {
    return new Promise((resolve) => {
        const timeout = setTimeout(() => {
            ws.removeEventListener('message', onMessage);
            resolve(FALLBACK_ICE_SERVERS);
        }, ICE_SERVERS_TIMEOUT);

        function onMessage(event: MessageEvent) {
            let msg: any;
            try {
                msg = JSON.parse(
                    typeof event.data === 'string'
                        ? event.data
                        : new TextDecoder().decode(event.data),
                );
            } catch {
                return;
            }
            if (msg.type !== 'ice-servers') return;

            clearTimeout(timeout);
            ws.removeEventListener('message', onMessage);

            const servers: RTCIceServer[] = [
                ...FALLBACK_ICE_SERVERS,
                ...(msg.iceServers ?? []),
            ];
            resolve(servers);
        }

        ws.addEventListener('message', onMessage);
        ws.send(JSON.stringify({ action: 'get-ice-servers' }));
    });
}

/**
 * Establish a WebRTC P2P connection via the Lambda signaling server.
 *
 * @param signalingWs - Open WebSocket to the signaling server.
 * @param isHost - Whether this peer is the offerer (host creates DataChannel).
 * @param peerConnectionId - The signaling connectionId of the remote peer.
 * @param iceServers - ICE server configuration (STUN + TURN).
 * @param bufferedMessages - Messages buffered before the handshake started.
 * @returns Promise resolving with the DataChannelTransport once the DataChannel opens.
 *
 * @example
 * ```ts
 * const transport = await establishP2P(ws, true, peerId, iceServers);
 * ```
 */
export function establishP2P(
    signalingWs: WebSocket,
    isHost: boolean,
    peerConnectionId: string,
    iceServers: RTCIceServer[],
    bufferedMessages: MessageEvent[] = [],
): Promise<DataChannelTransport> {
    const role = isHost ? 'HOST' : 'JOINER';
    return new Promise((resolve, reject) => {
        let pc: RTCPeerConnection;
        try {
            pc = new RTCPeerConnection({ iceServers });
        } catch (e: any) {
            reject(e);
            return;
        }
        let dc: RTCDataChannel | null = null;
        let resolved = false;

        const timeout = setTimeout(() => {
            if (!resolved) {
                resolved = true;
                try {
                    pc.close();
                } catch {}
                reject(new Error('WebRTC connection timed out'));
            }
        }, WEBRTC_TIMEOUT);

        function done(channel: RTCDataChannel) {
            if (resolved) return;
            resolved = true;
            clearTimeout(timeout);
            resolve(new DataChannelTransport(channel, pc, peerConnectionId));
        }

        pc.onicecandidate = (ev) => {
            if (ev.candidate) {
                signalingWs.send(
                    JSON.stringify({
                        action: 'signal',
                        data: { type: 'ice', candidate: ev.candidate },
                    }),
                );
            }
        };

        const pendingIceCandidates: RTCIceCandidate[] = [];
        let remoteDescriptionSet = false;

        function flushIceCandidates() {
            remoteDescriptionSet = true;
            for (const c of pendingIceCandidates) {
                pc.addIceCandidate(c).catch((err) =>
                    console.error(
                        `[P2P ${role}] Error adding queued ICE candidate:`,
                        err,
                    ),
                );
            }
            pendingIceCandidates.length = 0;
        }

        const onSignal = (event: MessageEvent) => {
            let msg: any;
            try {
                msg = JSON.parse(
                    typeof event.data === 'string'
                        ? event.data
                        : new TextDecoder().decode(event.data),
                );
            } catch {
                return;
            }

            if (msg.type !== 'signal') return;
            const signal = msg.data;

            if (signal.type === 'offer' && signal.sdp) {
                pc.setRemoteDescription(new RTCSessionDescription(signal))
                    .then(() => {
                        flushIceCandidates();
                        return pc.createAnswer();
                    })
                    .then((answer) => pc.setLocalDescription(answer))
                    .then(() => {
                        signalingWs.send(
                            JSON.stringify({
                                action: 'signal',
                                data: pc.localDescription,
                            }),
                        );
                    })
                    .catch((err) =>
                        console.error(
                            `[P2P ${role}] Error handling offer:`,
                            err,
                        ),
                    );
            } else if (signal.type === 'answer' && signal.sdp) {
                pc.setRemoteDescription(new RTCSessionDescription(signal))
                    .then(() => flushIceCandidates())
                    .catch((err) =>
                        console.error(
                            `[P2P ${role}] Error handling answer:`,
                            err,
                        ),
                    );
            } else if (signal.type === 'ice' && signal.candidate) {
                const candidate = new RTCIceCandidate(signal.candidate);
                if (remoteDescriptionSet) {
                    pc.addIceCandidate(candidate).catch((err) =>
                        console.error(
                            `[P2P ${role}] Error adding ICE candidate:`,
                            err,
                        ),
                    );
                } else {
                    pendingIceCandidates.push(candidate);
                }
            }
        };

        signalingWs.addEventListener('message', onSignal);

        for (const msg of bufferedMessages) {
            onSignal(msg);
        }

        if (isHost) {
            dc = pc.createDataChannel('game', { ordered: false });
            dc.binaryType = 'arraybuffer';
            dc.onopen = () => done(dc!);

            pc.createOffer()
                .then((offer) => pc.setLocalDescription(offer))
                .then(() => {
                    signalingWs.send(
                        JSON.stringify({
                            action: 'signal',
                            data: pc.localDescription,
                        }),
                    );
                })
                .catch((err) => {
                    console.error(`[P2P ${role}] Error creating offer:`, err);
                });
        } else {
            pc.ondatachannel = (ev) => {
                dc = ev.channel;
                dc.binaryType = 'arraybuffer';
                if (dc.readyState === 'open') {
                    done(dc);
                } else {
                    dc.onopen = () => done(dc!);
                }
            };
        }
    });
}
