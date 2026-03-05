import {
    applyStaggeredEntrance,
    applyButtonHoverScale,
} from './overlayAnimations';
import { DataChannelTransport } from '@pulse-ts/network/transports/datachannel';
import type { Transport } from '@pulse-ts/network';

/**
 * ICE servers for WebRTC peer connection establishment.
 * Google's public STUN server is sufficient for most NAT traversal.
 */
const ICE_SERVERS: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
];

/** Timeout (ms) waiting for WebRTC DataChannel to open. */
const WEBRTC_TIMEOUT = 15000;

/**
 * Build the Lambda signaling WebSocket URL.
 * In production, this comes from the Terraform output (API Gateway WebSocket endpoint).
 * For local development, falls back to localhost.
 */
function getSignalingUrl(): string {
    // Check for environment variable set at build time
    const envUrl =
        typeof (window as any).__SIGNALING_URL__ === 'string'
            ? (window as any).__SIGNALING_URL__
            : undefined;
    if (envUrl) return envUrl;

    // Fallback: assume signaling server is co-located
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${proto}//${window.location.host}`;
}

/** Result returned when the host completes the lobby. */
export interface HostResult {
    mode: 'host';
    /** Player ID chosen by the host (0 or 1). */
    playerId: number;
    /** P2P transport wrapping the established DataChannel. */
    transport: Transport;
}

/** Result returned when a joiner completes the lobby. */
export interface JoinResult {
    mode: 'join';
    /** Player ID assigned to the joiner by the host. */
    playerId: number;
    /** P2P transport wrapping the established DataChannel. */
    transport: Transport;
}

/** The outcome of the lobby flow. */
export type LobbyResult = HostResult | JoinResult;

/**
 * Display the online play lobby overlay. The user chooses to host or join,
 * configures their settings, and the lobby resolves with a {@link LobbyResult}
 * or `'back'` if they return to the main menu.
 *
 * @param container - The DOM element to mount the overlay into.
 * @returns A promise resolving with the lobby config or `'back'`.
 *
 * @example
 * ```ts
 * const result = await showLobby(document.body);
 * if (result === 'back') return;
 * // result.transport is ready for game networking
 * ```
 */
export function showLobby(
    container: HTMLElement,
): Promise<LobbyResult | 'back'> {
    return new Promise((resolve) => {
        const overlay = createOverlay();
        container.appendChild(overlay);

        requestAnimationFrame(() => {
            overlay.style.opacity = '1';
        });

        function finish(result: LobbyResult | 'back') {
            overlay.style.opacity = '0';
            overlay.addEventListener('transitionend', () => {
                overlay.remove();
                resolve(result);
            });
        }

        showLobbyMenu(overlay, finish);
    });
}

// ---------------------------------------------------------------------------
// WebRTC Handshake
// ---------------------------------------------------------------------------

/**
 * Establish a WebRTC P2P connection via the Lambda signaling server.
 *
 * @param signalingWs - Open WebSocket to the signaling server.
 * @param isHost - Whether this peer is the offerer (host creates DataChannel).
 * @param peerConnectionId - The signaling connectionId of the remote peer.
 * @returns Promise resolving with the DataChannelTransport once the DataChannel opens.
 */
function establishP2P(
    signalingWs: WebSocket,
    isHost: boolean,
    peerConnectionId: string,
): Promise<DataChannelTransport> {
    return new Promise((resolve, reject) => {
        const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
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

        // Send ICE candidates to peer via signaling
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

        // Listen for signaling messages from the peer
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
                    .then(() => pc.createAnswer())
                    .then((answer) => pc.setLocalDescription(answer))
                    .then(() => {
                        signalingWs.send(
                            JSON.stringify({
                                action: 'signal',
                                data: pc.localDescription,
                            }),
                        );
                    })
                    .catch(() => {});
            } else if (signal.type === 'answer' && signal.sdp) {
                pc.setRemoteDescription(
                    new RTCSessionDescription(signal),
                ).catch(() => {});
            } else if (signal.type === 'ice' && signal.candidate) {
                pc.addIceCandidate(new RTCIceCandidate(signal.candidate)).catch(
                    () => {},
                );
            }
        };

        signalingWs.addEventListener('message', onSignal);

        if (isHost) {
            // Host creates the DataChannel and sends the offer
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
                .catch(() => {});
        } else {
            // Joiner waits for the DataChannel from the host
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

// ---------------------------------------------------------------------------
// Screens
// ---------------------------------------------------------------------------

type Finish = (result: LobbyResult | 'back') => void;

function showLobbyMenu(overlay: HTMLElement, finish: Finish) {
    const content = clearAndCreateContent(overlay);

    const heading = createHeading('ONLINE PLAY');
    const btnHost = createButton('Host Game', '#48c9b0');
    const btnJoin = createButton('Join Game', '#e74c3c');
    const btnBack = createButton('Back', '#888');
    const buttons = createColumn(btnHost, btnJoin, btnBack);

    content.appendChild(heading);
    content.appendChild(buttons);

    applyStaggeredEntrance([heading, buttons], 100);
    applyButtonHoverScale(btnHost);
    applyButtonHoverScale(btnJoin);
    applyButtonHoverScale(btnBack);

    btnHost.addEventListener('click', () => showHostSetup(overlay, finish));
    btnJoin.addEventListener('click', () => showJoinBrowser(overlay, finish));
    btnBack.addEventListener('click', () => finish('back'));
}

function showHostSetup(overlay: HTMLElement, finish: Finish) {
    const content = clearAndCreateContent(overlay);

    const heading = createHeading('HOST GAME');
    const subheading = createSubheading('Choose your player');

    const btnP1 = createButton('Player 1', '#48c9b0');
    const btnP2 = createButton('Player 2', '#e74c3c');
    const playerRow = createRow(btnP1, btnP2);

    const btnBack = createButton('Back', '#888');
    const backCol = createColumn(btnBack);

    content.appendChild(heading);
    content.appendChild(subheading);
    content.appendChild(playerRow);
    content.appendChild(backCol);

    applyStaggeredEntrance([heading, subheading, playerRow, backCol], 100);
    applyButtonHoverScale(btnP1);
    applyButtonHoverScale(btnP2);
    applyButtonHoverScale(btnBack);

    btnP1.addEventListener('click', () => showHostWaiting(overlay, finish, 0));
    btnP2.addEventListener('click', () => showHostWaiting(overlay, finish, 1));
    btnBack.addEventListener('click', () => showLobbyMenu(overlay, finish));
}

function showHostWaiting(
    overlay: HTMLElement,
    finish: Finish,
    playerId: number,
) {
    const content = clearAndCreateContent(overlay);
    const sigUrl = getSignalingUrl();

    const heading = createHeading('HOSTING');
    const status = createStatusIndicator();
    const btnStart = createButton('Start Game', '#48c9b0');
    btnStart.style.display = 'none';
    const btnBack = createButton('Back', '#888');
    const buttons = createColumn(btnStart, btnBack);

    content.appendChild(heading);
    content.appendChild(status.el);
    content.appendChild(buttons);

    applyStaggeredEntrance([heading, status.el, buttons], 100);
    applyButtonHoverScale(btnStart);
    applyButtonHoverScale(btnBack);

    let ws: WebSocket | null = null;
    let joinerConnectionId: string | null = null;
    let cleaned = false;

    function cleanup() {
        if (cleaned) return;
        cleaned = true;
        if (ws && ws.readyState <= WebSocket.OPEN) ws.close();
        ws = null;
    }

    // Connect to signaling server
    status.set('connecting', 'Connecting to signaling server...');
    ws = new WebSocket(sigUrl);

    ws.addEventListener('open', () => {
        if (cleaned) return;
        // Create a lobby
        ws!.send(
            JSON.stringify({
                action: 'create-lobby',
                username: getUsername(),
            }),
        );
    });

    ws.addEventListener('error', () => {
        if (cleaned) return;
        status.set('error', 'Could not connect to signaling server');
    });

    ws.addEventListener('close', () => {
        if (cleaned) return;
        if (!joinerConnectionId) {
            status.set('error', 'Connection to signaling server lost');
        }
    });

    ws.addEventListener('message', (event) => {
        if (cleaned) return;
        let msg: any;
        try {
            msg = JSON.parse(event.data);
        } catch {
            return;
        }

        if (msg.type === 'lobby-created') {
            status.set('connected', 'Waiting for opponent...');
        } else if (msg.type === 'joiner-connected') {
            joinerConnectionId = msg.joinerConnectionId;
            const joinerName = msg.username || 'Opponent';
            status.set('connected', `${joinerName} joined!`);
            btnStart.style.display = '';
        } else if (msg.type === 'error') {
            status.set('error', msg.message || 'Unknown error');
        }
    });

    btnStart.addEventListener('click', async () => {
        if (!ws || !joinerConnectionId) return;
        btnStart.style.display = 'none';
        status.set('connecting', 'Establishing P2P connection...');

        // Tell the joiner the game is starting
        ws.send(JSON.stringify({ action: 'game-start' }));

        try {
            const transport = await establishP2P(ws, true, joinerConnectionId);
            cleanup();
            finish({ mode: 'host', playerId, transport });
        } catch {
            status.set('error', 'Failed to establish P2P connection');
            btnStart.style.display = '';
        }
    });

    btnBack.addEventListener('click', () => {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ action: 'leave-lobby' }));
        }
        cleanup();
        showHostSetup(overlay, finish);
    });
}

function showJoinBrowser(overlay: HTMLElement, finish: Finish) {
    const content = clearAndCreateContent(overlay);
    const sigUrl = getSignalingUrl();

    const heading = createHeading('JOIN GAME');
    const status = createStatusIndicator();
    const lobbyList = document.createElement('div');
    Object.assign(lobbyList.style, {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        alignItems: 'center',
        minHeight: '60px',
        maxHeight: '240px',
        overflowY: 'auto',
        width: '100%',
        maxWidth: '320px',
    } as Partial<CSSStyleDeclaration>);

    const btnRefresh = createButton('Refresh', '#48c9b0');
    const btnBack = createButton('Back', '#888');
    const buttons = createColumn(btnRefresh, btnBack);

    content.appendChild(heading);
    content.appendChild(status.el);
    content.appendChild(lobbyList);
    content.appendChild(buttons);

    applyStaggeredEntrance([heading, status.el, lobbyList, buttons], 100);
    applyButtonHoverScale(btnRefresh);
    applyButtonHoverScale(btnBack);

    let ws: WebSocket | null = null;
    let cleaned = false;

    function cleanup() {
        if (cleaned) return;
        cleaned = true;
        if (ws && ws.readyState <= WebSocket.OPEN) ws.close();
        ws = null;
    }

    function requestLobbies() {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ action: 'list-lobbies' }));
        }
    }

    // Connect to signaling server
    status.set('connecting', 'Connecting...');
    ws = new WebSocket(sigUrl);

    ws.addEventListener('open', () => {
        if (cleaned) return;
        status.set('connected', 'Looking for lobbies...');
        requestLobbies();
    });

    ws.addEventListener('error', () => {
        if (cleaned) return;
        status.set('error', 'Could not connect to signaling server');
    });

    ws.addEventListener('close', () => {
        if (cleaned) return;
        status.set('error', 'Connection lost');
    });

    ws.addEventListener('message', (event) => {
        if (cleaned) return;
        let msg: any;
        try {
            msg = JSON.parse(event.data);
        } catch {
            return;
        }

        if (msg.type === 'lobby-list') {
            renderLobbies(lobbyList, msg.lobbies ?? [], (lobbyId: string) => {
                showJoinWaiting(overlay, finish, ws!, lobbyId, cleanup);
            });
            if (msg.lobbies?.length === 0) {
                status.set('connected', 'No lobbies available');
            } else {
                status.set(
                    'connected',
                    `${msg.lobbies.length} ${msg.lobbies.length === 1 ? 'lobby' : 'lobbies'} found`,
                );
            }
        } else if (msg.type === 'error') {
            status.set('error', msg.message || 'Unknown error');
        }
    });

    btnRefresh.addEventListener('click', () => {
        status.set('connecting', 'Refreshing...');
        requestLobbies();
    });

    btnBack.addEventListener('click', () => {
        cleanup();
        showLobbyMenu(overlay, finish);
    });
}

function renderLobbies(
    container: HTMLElement,
    lobbies: Array<{ lobbyId: string; hostUsername: string }>,
    onJoin: (lobbyId: string) => void,
) {
    container.innerHTML = '';
    for (const lobby of lobbies) {
        const btn = createButton(`${lobby.hostUsername}'s Game`, '#48c9b0');
        btn.style.minWidth = 'min(280px, 70vw)';
        applyButtonHoverScale(btn);
        btn.addEventListener('click', () => onJoin(lobby.lobbyId));
        container.appendChild(btn);
    }
}

function showJoinWaiting(
    overlay: HTMLElement,
    finish: Finish,
    ws: WebSocket,
    lobbyId: string,
    parentCleanup: () => void,
) {
    const content = clearAndCreateContent(overlay);

    const heading = createHeading('JOINING');
    const status = createStatusIndicator();
    const btnBack = createButton('Back', '#888');
    const backCol = createColumn(btnBack);

    content.appendChild(heading);
    content.appendChild(status.el);
    content.appendChild(backCol);

    applyStaggeredEntrance([heading, status.el, backCol], 100);
    applyButtonHoverScale(btnBack);

    let cleaned = false;
    let hostConnectionId: string | null = null;

    function cleanup() {
        if (cleaned) return;
        cleaned = true;
    }

    status.set('connecting', 'Joining lobby...');
    ws.send(
        JSON.stringify({
            action: 'join-lobby',
            lobbyId,
            username: getUsername(),
        }),
    );

    const onMessage = async (event: MessageEvent) => {
        if (cleaned) return;
        let msg: any;
        try {
            msg = JSON.parse(event.data);
        } catch {
            return;
        }

        if (msg.type === 'join-failed') {
            status.set('error', msg.reason || 'Could not join lobby');
        } else if (msg.type === 'join-accepted') {
            hostConnectionId = msg.hostConnectionId;
            status.set('connected', `Joined ${msg.hostUsername}'s game`);
            status.set('connecting', 'Waiting for host to start...');
        } else if (msg.type === 'game-start' && hostConnectionId) {
            cleanup();
            ws.removeEventListener('message', onMessage);
            status.set('connecting', 'Establishing P2P connection...');

            try {
                const transport = await establishP2P(
                    ws,
                    false,
                    hostConnectionId,
                );
                parentCleanup();
                finish({ mode: 'join', playerId: 1, transport });
            } catch {
                status.set('error', 'Failed to establish P2P connection');
            }
        } else if (msg.type === 'peer-disconnected') {
            status.set('error', 'Host disconnected');
        } else if (msg.type === 'error') {
            status.set('error', msg.message || 'Unknown error');
        }
    };

    ws.addEventListener('message', onMessage);

    btnBack.addEventListener('click', () => {
        cleanup();
        ws.removeEventListener('message', onMessage);
        ws.send(JSON.stringify({ action: 'leave-lobby' }));
        showJoinBrowser(overlay, finish);
    });
}

// ---------------------------------------------------------------------------
// Username management
// ---------------------------------------------------------------------------

const USERNAME_KEY = 'pulse-arena-username';

function getUsername(): string {
    try {
        return localStorage.getItem(USERNAME_KEY) || 'Player';
    } catch {
        return 'Player';
    }
}

// ---------------------------------------------------------------------------
// Shared UI helpers
// ---------------------------------------------------------------------------

function createOverlay(): HTMLDivElement {
    const el = document.createElement('div');
    Object.assign(el.style, {
        position: 'absolute',
        inset: '0',
        zIndex: '5000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(10, 10, 26, 0.65)',
        opacity: '0',
        transition: 'opacity 0.4s ease-in-out',
    } as Partial<CSSStyleDeclaration>);
    return el;
}

function clearAndCreateContent(overlay: HTMLElement): HTMLDivElement {
    overlay.innerHTML = '';
    const content = document.createElement('div');
    Object.assign(content.style, {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
        padding: '0 20px',
    } as Partial<CSSStyleDeclaration>);
    overlay.appendChild(content);
    return content;
}

function createHeading(text: string): HTMLDivElement {
    const el = document.createElement('div');
    el.textContent = text;
    Object.assign(el.style, {
        font: 'bold clamp(22px, 6vw, 32px) monospace',
        color: '#fff',
        textShadow: '0 0 16px rgba(72, 201, 176, 0.5)',
        letterSpacing: '3px',
        marginBottom: '8px',
    } as Partial<CSSStyleDeclaration>);
    return el;
}

function createSubheading(text: string): HTMLDivElement {
    const el = document.createElement('div');
    el.textContent = text;
    Object.assign(el.style, {
        font: '14px monospace',
        color: '#888',
        letterSpacing: '2px',
        textTransform: 'uppercase',
    } as Partial<CSSStyleDeclaration>);
    return el;
}

function createButton(label: string, color: string): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.textContent = label;
    Object.assign(btn.style, {
        font: 'bold clamp(14px, 3.5vw, 18px) monospace',
        color: '#fff',
        backgroundColor: 'rgba(255,255,255,0.08)',
        border: '2px solid rgba(255,255,255,0.2)',
        borderRadius: '6px',
        padding: '12px 32px',
        cursor: 'pointer',
        minWidth: 'min(200px, 70vw)',
        minHeight: '44px',
        transition: 'all 0.2s ease',
    } as Partial<CSSStyleDeclaration>);

    btn.addEventListener('pointerdown', () => {
        btn.style.backgroundColor = 'rgba(255,255,255,0.15)';
        btn.style.borderColor = color;
        btn.style.boxShadow = `0 0 12px ${color}44`;
    });
    btn.addEventListener('pointerup', () => {
        btn.style.backgroundColor = 'rgba(255,255,255,0.08)';
        btn.style.borderColor = 'rgba(255,255,255,0.2)';
        btn.style.boxShadow = 'none';
    });
    btn.addEventListener('pointerleave', () => {
        btn.style.backgroundColor = 'rgba(255,255,255,0.08)';
        btn.style.borderColor = 'rgba(255,255,255,0.2)';
        btn.style.boxShadow = 'none';
    });

    return btn;
}

function createColumn(...children: HTMLElement[]): HTMLDivElement {
    const col = document.createElement('div');
    Object.assign(col.style, {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        alignItems: 'center',
    } as Partial<CSSStyleDeclaration>);
    children.forEach((c) => col.appendChild(c));
    return col;
}

function createRow(...children: HTMLElement[]): HTMLDivElement {
    const row = document.createElement('div');
    Object.assign(row.style, {
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
        flexWrap: 'wrap',
        justifyContent: 'center',
    } as Partial<CSSStyleDeclaration>);
    children.forEach((c) => row.appendChild(c));
    return row;
}

/** Status indicator element with a setter for status text and color. */
interface StatusIndicator {
    el: HTMLDivElement;
    set: (
        state: 'idle' | 'connecting' | 'connected' | 'error',
        msg?: string,
    ) => void;
}

const STATUS_COLORS: Record<string, string> = {
    idle: '#888',
    connecting: '#f1c40f',
    connected: '#48c9b0',
    error: '#e74c3c',
};

function createStatusIndicator(): StatusIndicator {
    const el = document.createElement('div');
    Object.assign(el.style, {
        font: '13px monospace',
        color: '#888',
        minHeight: '20px',
        textAlign: 'center',
    } as Partial<CSSStyleDeclaration>);

    return {
        el,
        set(state, msg) {
            el.style.color = STATUS_COLORS[state] ?? '#888';
            el.textContent = msg ?? '';
        },
    };
}
