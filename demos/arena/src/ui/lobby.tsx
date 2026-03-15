import {
    applyStaggeredEntrance,
    applyButtonHoverScale,
} from './overlayAnimations';
import type { Transport } from '@pulse-ts/network';
import { getAppVersion, isUpdateAvailable } from './versionCheck';
import { versionsMatch } from './versionMatch';
import { getSignalingUrl, requestIceServers, establishP2P } from './network/webrtc';
import { getUsername, setUsername, hasUsername, USERNAME_MAX_LENGTH } from './username';
import {
    createOverlay,
    clearAndCreateContent,
    createHeading,
    createSubheading,
    createBtn,
    createColumnEl,
    createRowEl,
    createStatusIndicator,
} from './ui/lobbyHelpers';

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
// Screens
// ---------------------------------------------------------------------------

type Finish = (result: LobbyResult | 'back') => void;

function showLobbyMenu(overlay: HTMLElement, finish: Finish) {
    if (!hasUsername()) {
        showUsernamePrompt(overlay, finish, false);
        return;
    }

    const content = clearAndCreateContent(overlay);

    const heading = createHeading('ONLINE PLAY');
    const nameLabel = createSubheading(`Playing as: ${getUsername()}`);

    const btnHost = createBtn('Host Game', '#48c9b0');
    const btnJoin = createBtn('Join Game', '#e74c3c');
    const btnChangeName = createBtn('Change Name', '#f1c40f');
    const btnBack = createBtn('Back', '#888');
    const buttons = createColumnEl(btnHost, btnJoin, btnChangeName, btnBack);

    content.appendChild(heading);
    content.appendChild(nameLabel);
    content.appendChild(buttons);

    applyStaggeredEntrance([heading, nameLabel, buttons], 100);
    applyButtonHoverScale(btnHost);
    applyButtonHoverScale(btnJoin);
    applyButtonHoverScale(btnChangeName);
    applyButtonHoverScale(btnBack);

    btnHost.addEventListener('click', () => showHostSetup(overlay, finish));
    btnJoin.addEventListener('click', () => showJoinBrowser(overlay, finish));
    btnChangeName.addEventListener('click', () =>
        showUsernamePrompt(overlay, finish, true),
    );
    btnBack.addEventListener('click', () => finish('back'));
}

function showUsernamePrompt(
    overlay: HTMLElement,
    finish: Finish,
    isEdit: boolean,
) {
    const content = clearAndCreateContent(overlay);

    const heading = createHeading(isEdit ? 'CHANGE NAME' : 'ENTER YOUR NAME');

    const input = document.createElement('input');
    input.type = 'text';
    input.maxLength = USERNAME_MAX_LENGTH;
    input.value = getUsername();
    input.placeholder = 'Your name...';
    Object.assign(input.style, {
        font: 'bold 18px monospace',
        color: '#fff',
        backgroundColor: 'rgba(255,255,255,0.08)',
        border: '2px solid rgba(255,255,255,0.3)',
        borderRadius: '6px',
        padding: '12px 16px',
        textAlign: 'center',
        outline: 'none',
        minWidth: 'min(240px, 70vw)',
        minHeight: '44px',
        transition: 'border-color 0.2s ease',
    } as Partial<CSSStyleDeclaration>);
    input.addEventListener('focus', () => {
        input.style.borderColor = '#48c9b0';
    });
    input.addEventListener('blur', () => {
        input.style.borderColor = 'rgba(255,255,255,0.3)';
    });

    const errorMsg = document.createElement('div');
    Object.assign(errorMsg.style, {
        font: '13px monospace',
        color: '#e74c3c',
        minHeight: '18px',
        textAlign: 'center',
    } as Partial<CSSStyleDeclaration>);

    const btnConfirm = createBtn(isEdit ? 'Save' : 'Continue', '#48c9b0');
    const btnBack = createBtn('Back', '#888');
    const buttons = createColumnEl(btnConfirm, btnBack);

    content.appendChild(heading);
    content.appendChild(input);
    content.appendChild(errorMsg);
    content.appendChild(buttons);

    applyStaggeredEntrance([heading, input, buttons], 100);
    applyButtonHoverScale(btnConfirm);
    applyButtonHoverScale(btnBack);

    requestAnimationFrame(() => input.focus());

    function tryConfirm() {
        const name = input.value.trim();
        if (name.length === 0) {
            errorMsg.textContent = 'Name cannot be empty';
            return;
        }
        setUsername(name);
        showLobbyMenu(overlay, finish);
    }

    btnConfirm.addEventListener('click', tryConfirm);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') tryConfirm();
    });

    btnBack.addEventListener('click', () => {
        if (isEdit) {
            showLobbyMenu(overlay, finish);
        } else {
            finish('back');
        }
    });
}

function showHostSetup(overlay: HTMLElement, finish: Finish) {
    const content = clearAndCreateContent(overlay);

    const heading = createHeading('HOST GAME');
    const subheading = createSubheading('Choose your player');

    const btnP1 = createBtn('Player 1', '#48c9b0');
    const btnP2 = createBtn('Player 2', '#e74c3c');
    const playerRow = createRowEl(btnP1, btnP2);

    const btnBack = createBtn('Back', '#888');
    const backCol = createColumnEl(btnBack);

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
    const btnStart = createBtn('Start Game', '#48c9b0');
    btnStart.style.display = 'none';
    const btnBack = createBtn('Back', '#888');
    const buttons = createColumnEl(btnStart, btnBack);

    content.appendChild(heading);
    content.appendChild(status.el);
    content.appendChild(buttons);

    applyStaggeredEntrance([heading, status.el, buttons], 100);
    applyButtonHoverScale(btnStart);
    applyButtonHoverScale(btnBack);

    let ws: WebSocket | null = null;
    let joinerConnectionId: string | null = null;
    let joinerVersion: string | null = null;
    let cleaned = false;

    function cleanup() {
        if (cleaned) return;
        cleaned = true;
        if (ws && ws.readyState <= WebSocket.OPEN) ws.close();
        ws = null;
    }

    status.set('connecting', 'Connecting to signaling server...');
    ws = new WebSocket(sigUrl);

    ws.addEventListener('open', () => {
        if (cleaned) return;
        ws!.send(
            JSON.stringify({
                action: 'create-lobby',
                username: getUsername(),
                version: getAppVersion(),
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
            joinerVersion = msg.version ?? null;
            const joinerName = msg.username || 'Opponent';

            if (!versionsMatch(getAppVersion(), joinerVersion ?? '')) {
                showVersionMismatch(overlay, finish, cleanup);
                return;
            }

            status.set('connected', `${joinerName} joined!`);
            btnStart.style.display = '';
        } else if (msg.type === 'error') {
            status.set('error', msg.message || 'Unknown error');
        }
    });

    btnStart.addEventListener('click', async () => {
        if (!ws || !joinerConnectionId) return;
        btnStart.style.display = 'none';
        status.set('connecting', 'Fetching relay credentials...');

        const iceServers = await requestIceServers(ws);

        status.set('connecting', 'Establishing P2P connection...');

        ws.send(JSON.stringify({ action: 'game-start' }));

        try {
            const transport = await establishP2P(
                ws,
                true,
                joinerConnectionId,
                iceServers,
            );
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

    const btnRefresh = createBtn('Refresh', '#48c9b0');
    const btnBack = createBtn('Back', '#888');
    const buttons = createColumnEl(btnRefresh, btnBack);

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
        const btn = createBtn(`${lobby.hostUsername}'s Game`, '#48c9b0');
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
    const btnBack = createBtn('Back', '#888');
    const backCol = createColumnEl(btnBack);

    content.appendChild(heading);
    content.appendChild(status.el);
    content.appendChild(backCol);

    applyStaggeredEntrance([heading, status.el, backCol], 100);
    applyButtonHoverScale(btnBack);

    let cleaned = false;
    let hostConnectionId: string | null = null;

    const signalBuffer: MessageEvent[] = [];
    const signalBufferHandler = (ev: MessageEvent) => {
        try {
            const m = JSON.parse(ev.data);
            if (m.type === 'signal') signalBuffer.push(ev);
        } catch {
            /* ignore non-JSON */
        }
    };
    ws.addEventListener('message', signalBufferHandler);

    function cleanup() {
        if (cleaned) return;
        cleaned = true;
        ws.removeEventListener('message', signalBufferHandler);
    }

    status.set('connecting', 'Joining lobby...');
    ws.send(
        JSON.stringify({
            action: 'join-lobby',
            lobbyId,
            username: getUsername(),
            version: getAppVersion(),
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
            const hostVersion: string = msg.version ?? '';

            if (!versionsMatch(getAppVersion(), hostVersion)) {
                ws.removeEventListener('message', onMessage);
                cleanup();
                parentCleanup();
                showVersionMismatch(overlay, finish);
                return;
            }

            hostConnectionId = msg.hostConnectionId;
            status.set('connected', `Joined ${msg.hostUsername}'s game`);
            status.set('connecting', 'Waiting for host to start...');
        } else if (msg.type === 'game-start' && hostConnectionId) {
            ws.removeEventListener('message', onMessage);
            status.set('connecting', 'Fetching relay credentials...');

            const iceServers = await requestIceServers(ws);

            ws.removeEventListener('message', signalBufferHandler);
            status.set('connecting', 'Establishing P2P connection...');

            try {
                const transport = await establishP2P(
                    ws,
                    false,
                    hostConnectionId,
                    iceServers,
                    signalBuffer,
                );
                cleanup();
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
// Version mismatch screen
// ---------------------------------------------------------------------------

/** Auto-reload delay when the local client is the stale one (ms). */
const VERSION_MISMATCH_RELOAD_DELAY = 3000;

function showVersionMismatch(
    overlay: HTMLElement,
    finish: Finish,
    cleanupFn?: () => void,
) {
    const content = clearAndCreateContent(overlay);

    const heading = createHeading('VERSION MISMATCH');

    const stale = isUpdateAvailable();
    const message = document.createElement('div');
    Object.assign(message.style, {
        font: '14px monospace',
        color: '#ccc',
        textAlign: 'center',
        maxWidth: '320px',
        lineHeight: '1.6',
    } as Partial<CSSStyleDeclaration>);

    if (stale) {
        message.textContent =
            'Your game is out of date. Refreshing to get the latest version...';
    } else {
        message.textContent =
            'Your opponent is running a different version. Returning to lobby...';
    }

    const status = createStatusIndicator();
    status.set(stale ? 'error' : 'connecting', stale ? 'Refreshing...' : '');

    content.appendChild(heading);
    content.appendChild(message);
    content.appendChild(status.el);

    applyStaggeredEntrance([heading, message, status.el], 100);

    if (stale) {
        setTimeout(() => {
            location.reload();
        }, VERSION_MISMATCH_RELOAD_DELAY);
    } else {
        const btnBack = createBtn('Back to Lobby', '#888');
        content.appendChild(btnBack);
        applyButtonHoverScale(btnBack);
        btnBack.addEventListener('click', () => {
            if (cleanupFn) cleanupFn();
            showLobbyMenu(overlay, finish);
        });
    }
}
