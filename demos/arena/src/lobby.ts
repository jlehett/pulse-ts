/** Default WebSocket server port for the arena relay. */
const DEFAULT_PORT = 8080;

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

    const heading = createHeading('HOSTING');

    const info = document.createElement('div');
    Object.assign(info.style, {
        font: '14px monospace',
        color: '#aaa',
        textAlign: 'center',
        lineHeight: '1.8',
    } as Partial<CSSStyleDeclaration>);
    info.innerHTML = [
        'Start the relay server on this machine:',
        `<span style="color:#48c9b0">npx tsx src/server.ts</span>`,
        '',
        `Port: <span style="color:#fff">${DEFAULT_PORT}</span>`,
        'Share your IP address with your opponent.',
    ].join('<br>');

    const status = createStatusIndicator();
    const btnStart = createButton('Start', '#48c9b0');
    const btnBack = createButton('Back', '#888');
    const buttons = createColumn(btnStart, btnBack);

    content.appendChild(heading);
    content.appendChild(info);
    content.appendChild(status.el);
    content.appendChild(buttons);

    btnStart.addEventListener('click', () => {
        finish({
            mode: 'host',
            playerId,
            wsUrl: `ws://localhost:${DEFAULT_PORT}`,
        });
    });
    btnBack.addEventListener('click', () => showHostSetup(overlay, finish));
}

function showJoinSetup(overlay: HTMLElement, finish: Finish) {
    const content = clearAndCreateContent(overlay);

    const heading = createHeading('JOIN GAME');

    const label = createSubheading('Host address');

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = '192.168.1.x';
    Object.assign(input.style, {
        font: '16px monospace',
        color: '#fff',
        backgroundColor: 'rgba(255,255,255,0.08)',
        border: '2px solid rgba(255,255,255,0.2)',
        borderRadius: '6px',
        padding: '10px 16px',
        width: '240px',
        textAlign: 'center',
        outline: 'none',
    } as Partial<CSSStyleDeclaration>);
    input.addEventListener('focus', () => {
        input.style.borderColor = '#e74c3c';
    });
    input.addEventListener('blur', () => {
        input.style.borderColor = 'rgba(255,255,255,0.2)';
    });

    const status = createStatusIndicator();
    const btnConnect = createButton('Connect', '#e74c3c');
    const btnBack = createButton('Back', '#888');
    const buttons = createColumn(btnConnect, btnBack);

    content.appendChild(heading);
    content.appendChild(label);
    content.appendChild(input);
    content.appendChild(status.el);
    content.appendChild(buttons);

    btnConnect.addEventListener('click', () => {
        const address = input.value.trim();
        if (!address) {
            status.set('error', 'Enter a host address');
            return;
        }
        finish({
            mode: 'join',
            wsUrl: `ws://${address}:${DEFAULT_PORT}`,
        });
    });
    btnBack.addEventListener('click', () => showLobbyMenu(overlay, finish));
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
    } as Partial<CSSStyleDeclaration>);
    overlay.appendChild(content);
    return content;
}

function createHeading(text: string): HTMLDivElement {
    const el = document.createElement('div');
    el.textContent = text;
    Object.assign(el.style, {
        font: 'bold 32px monospace',
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
        font: 'bold 18px monospace',
        color: '#fff',
        backgroundColor: 'rgba(255,255,255,0.08)',
        border: '2px solid rgba(255,255,255,0.2)',
        borderRadius: '6px',
        padding: '12px 32px',
        cursor: 'pointer',
        minWidth: '200px',
        transition: 'all 0.2s ease',
    } as Partial<CSSStyleDeclaration>);

    btn.addEventListener('mouseenter', () => {
        btn.style.backgroundColor = 'rgba(255,255,255,0.15)';
        btn.style.borderColor = color;
        btn.style.boxShadow = `0 0 12px ${color}44`;
    });
    btn.addEventListener('mouseleave', () => {
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
