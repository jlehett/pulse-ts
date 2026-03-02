import {
    applyStaggeredEntrance,
    applyButtonHoverScale,
} from './overlayAnimations';

/** Timeout (ms) waiting for host acknowledgement after join-request. */
const JOIN_TIMEOUT = 5000;

/**
 * Build the WebSocket relay URL from the current page location.
 * Works for localhost, LAN IPs, and external tunnel URLs (e.g. ngrok).
 *
 * @returns A `ws://` or `wss://` URL pointing at the current host.
 */
function getRelayUrl(): string {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${proto}//${window.location.host}`;
}

/** Result returned when the host completes the lobby. */
export interface HostResult {
    mode: 'host';
    /** Player ID chosen by the host (0 or 1). */
    playerId: number;
    /** WebSocket URL to connect to (localhost). */
    wsUrl: string;
}

/** Result returned when a joiner completes the lobby. */
export interface JoinResult {
    mode: 'join';
    /** Player ID assigned to the joiner by the host. */
    playerId: number;
    /** WebSocket URL to the host's relay server. */
    wsUrl: string;
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
 * console.log(result.wsUrl);
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
// Lobby wire protocol
// ---------------------------------------------------------------------------

/** Lobby message types exchanged through the relay server. */
interface LobbyMessage {
    type: 'join-request' | 'host-accept' | 'lobby-full' | 'game-start';
    joinerPlayerId?: number;
}

/**
 * Send a lobby message through a WebSocket connection.
 * Messages are JSON-encoded packets on the `'lobby'` channel,
 * which the relay server broadcasts to other peers in the room.
 *
 * @param ws - The WebSocket connection.
 * @param msg - The lobby message to send.
 */
function sendLobbyMessage(ws: WebSocket, msg: LobbyMessage): void {
    ws.send(JSON.stringify({ channel: 'lobby', data: msg }));
}

/**
 * Parse an incoming WebSocket message as a lobby message.
 * Returns `null` if the message is not a lobby-channel packet.
 *
 * @param event - The WebSocket MessageEvent.
 * @returns The parsed lobby message, or `null`.
 */
function parseLobbyMessage(event: MessageEvent): LobbyMessage | null {
    try {
        const pkt = JSON.parse(
            typeof event.data === 'string'
                ? event.data
                : new TextDecoder().decode(event.data),
        );
        if (pkt?.channel === 'lobby' && pkt.data?.type) {
            return pkt.data as LobbyMessage;
        }
    } catch {
        /* ignore non-JSON frames */
    }
    return null;
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
    btnJoin.addEventListener('click', () => showJoinSetup(overlay, finish));
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

    content.appendChild(heading);
    content.appendChild(subheading);
    content.appendChild(playerRow);
    content.appendChild(btnBack);

    applyStaggeredEntrance([heading, subheading, playerRow, btnBack], 100);
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
    const wsUrl = getRelayUrl();

    const heading = createHeading('HOSTING');

    const info = document.createElement('div');
    Object.assign(info.style, {
        font: '14px monospace',
        color: '#aaa',
        textAlign: 'center',
        lineHeight: '1.8',
        wordBreak: 'break-all',
    } as Partial<CSSStyleDeclaration>);
    info.innerHTML = [
        'Share this page\u2019s URL with your opponent:',
        `<span style="color:#48c9b0">${window.location.href}</span>`,
    ].join('<br>');

    const status = createStatusIndicator();
    const btnStart = createButton('Start Game', '#48c9b0');
    btnStart.style.display = 'none';
    const btnBack = createButton('Back', '#888');
    const buttons = createColumn(btnStart, btnBack);

    content.appendChild(heading);
    content.appendChild(info);
    content.appendChild(status.el);
    content.appendChild(buttons);

    applyStaggeredEntrance([heading, info, status.el, buttons], 100);
    applyButtonHoverScale(btnStart);
    applyButtonHoverScale(btnBack);

    // Track connection state for cleanup
    let ws: WebSocket | null = null;
    let hasJoiner = false;
    let cleaned = false;

    function cleanup() {
        if (cleaned) return;
        cleaned = true;
        if (ws && ws.readyState <= WebSocket.OPEN) {
            ws.close();
        }
        ws = null;
    }

    // Connect to the relay server
    status.set('connecting', 'Connecting to relay server...');
    ws = new WebSocket(wsUrl);

    ws.addEventListener('open', () => {
        if (cleaned) return;
        status.set('connected', 'Waiting for opponent...');
    });

    ws.addEventListener('error', () => {
        if (cleaned) return;
        status.set(
            'error',
            'Could not connect to relay server. Is it running?',
        );
    });

    ws.addEventListener('close', () => {
        if (cleaned) return;
        if (!hasJoiner) {
            status.set('error', 'Connection to relay server lost');
        }
    });

    ws.addEventListener('message', (event) => {
        if (cleaned) return;
        const msg = parseLobbyMessage(event);
        if (!msg) return;

        if (msg.type === 'join-request' && !hasJoiner) {
            hasJoiner = true;
            const joinerPlayerId = 1 - playerId;
            sendLobbyMessage(ws!, {
                type: 'host-accept',
                joinerPlayerId,
            });
            status.set('connected', 'Opponent connected!');
            btnStart.style.display = '';
        } else if (msg.type === 'join-request' && hasJoiner) {
            sendLobbyMessage(ws!, { type: 'lobby-full' });
        }
    });

    btnStart.addEventListener('click', () => {
        if (!ws || !hasJoiner) return;
        sendLobbyMessage(ws, { type: 'game-start' });
        cleanup();
        finish({ mode: 'host', playerId, wsUrl });
    });

    btnBack.addEventListener('click', () => {
        cleanup();
        showHostSetup(overlay, finish);
    });
}

function showJoinSetup(overlay: HTMLElement, finish: Finish) {
    const content = clearAndCreateContent(overlay);
    const wsUrl = getRelayUrl();

    const heading = createHeading('JOIN GAME');

    const status = createStatusIndicator();
    const btnBack = createButton('Back', '#888');

    content.appendChild(heading);
    content.appendChild(status.el);
    content.appendChild(btnBack);

    applyStaggeredEntrance([heading, status.el, btnBack], 100);
    applyButtonHoverScale(btnBack);

    let ws: WebSocket | null = null;
    let joinTimeout: ReturnType<typeof setTimeout> | null = null;
    let cleaned = false;

    function cleanup() {
        if (cleaned) return;
        cleaned = true;
        if (joinTimeout) {
            clearTimeout(joinTimeout);
            joinTimeout = null;
        }
        if (ws && ws.readyState <= WebSocket.OPEN) {
            ws.close();
        }
        ws = null;
    }

    // Auto-connect immediately — the relay lives on the same host.
    status.set('connecting', 'Connecting...');
    ws = new WebSocket(wsUrl);

    ws.addEventListener('open', () => {
        if (cleaned) return;
        status.set('connecting', 'Connected. Looking for host...');
        sendLobbyMessage(ws!, { type: 'join-request' });

        // Timeout if host doesn't respond
        joinTimeout = setTimeout(() => {
            if (cleaned) return;
            status.set('error', 'No host found in lobby');
        }, JOIN_TIMEOUT);
    });

    ws.addEventListener('error', () => {
        if (cleaned) return;
        status.set('error', 'Could not connect to server');
    });

    ws.addEventListener('close', () => {
        if (cleaned) return;
        status.set('error', 'Connection lost');
    });

    ws.addEventListener('message', (event) => {
        if (cleaned) return;
        const msg = parseLobbyMessage(event);
        if (!msg) return;

        if (msg.type === 'host-accept') {
            if (joinTimeout) {
                clearTimeout(joinTimeout);
                joinTimeout = null;
            }
            const joinerPlayerId = msg.joinerPlayerId ?? 1;
            status.set('connected', 'Waiting for host to start...');

            // Now listen for game-start
            const onGameStart = (e: MessageEvent) => {
                const m = parseLobbyMessage(e);
                if (m?.type === 'game-start') {
                    ws!.removeEventListener('message', onGameStart);
                    cleanup();
                    finish({
                        mode: 'join',
                        playerId: joinerPlayerId,
                        wsUrl,
                    });
                }
            };
            ws!.addEventListener('message', onGameStart);
        } else if (msg.type === 'lobby-full') {
            if (joinTimeout) {
                clearTimeout(joinTimeout);
                joinTimeout = null;
            }
            status.set('error', 'Lobby is full');
        }
    });

    btnBack.addEventListener('click', () => {
        cleanup();
        showLobbyMenu(overlay, finish);
    });
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
        backgroundColor: 'rgba(10, 10, 26, 0.92)',
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
