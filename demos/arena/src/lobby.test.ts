import { showLobby, type LobbyResult } from './lobby';

// ---------------------------------------------------------------------------
// WebSocket mock
// ---------------------------------------------------------------------------

type WsListener = (event: any) => void;

class MockWebSocket {
    static readonly CONNECTING = 0;
    static readonly OPEN = 1;
    static readonly CLOSING = 2;
    static readonly CLOSED = 3;

    readonly CONNECTING = 0;
    readonly OPEN = 1;
    readonly CLOSING = 2;
    readonly CLOSED = 3;

    url: string;
    readyState = MockWebSocket.CONNECTING;
    private listeners: Record<string, WsListener[]> = {};
    sent: string[] = [];

    constructor(url: string) {
        this.url = url;
        // Track instance for test access
        mockWsInstances.push(this);
    }

    addEventListener(event: string, fn: WsListener) {
        (this.listeners[event] ??= []).push(fn);
    }

    removeEventListener(event: string, fn: WsListener) {
        const arr = this.listeners[event];
        if (arr) {
            const idx = arr.indexOf(fn);
            if (idx >= 0) arr.splice(idx, 1);
        }
    }

    send(data: string) {
        this.sent.push(data);
    }

    close() {
        this.readyState = MockWebSocket.CLOSED;
    }

    // Test helpers to simulate server events
    simulateOpen() {
        this.readyState = MockWebSocket.OPEN;
        this.fire('open', {});
    }

    simulateError() {
        this.fire('error', {});
    }

    simulateClose() {
        this.readyState = MockWebSocket.CLOSED;
        this.fire('close', {});
    }

    simulateMessage(data: any) {
        this.fire('message', { data: JSON.stringify(data) });
    }

    private fire(event: string, detail: any) {
        for (const fn of this.listeners[event] ?? []) fn(detail);
    }
}

let mockWsInstances: MockWebSocket[] = [];

beforeAll(() => {
    (globalThis as any).WebSocket = MockWebSocket;
});

afterAll(() => {
    delete (globalThis as any).WebSocket;
});

// ---------------------------------------------------------------------------
// window.location mock — lobby derives relay URLs from the current page.
// ---------------------------------------------------------------------------

const locationBackup = window.location;

beforeAll(() => {
    Object.defineProperty(window, 'location', {
        writable: true,
        value: {
            protocol: 'http:',
            host: 'localhost:5173',
            port: '5173',
            href: 'http://localhost:5173/',
        },
    });
});

afterAll(() => {
    Object.defineProperty(window, 'location', {
        writable: true,
        value: locationBackup,
    });
});

describe('showLobby', () => {
    let container: HTMLDivElement;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
        mockWsInstances = [];
        jest.useFakeTimers();
    });

    afterEach(() => {
        container.remove();
        jest.useRealTimers();
    });

    function overlay(): HTMLElement {
        return container.firstElementChild as HTMLElement;
    }

    function clickButton(label: string) {
        const buttons = container.querySelectorAll('button');
        const btn = Array.from(buttons).find((b) => b.textContent === label);
        if (!btn) throw new Error(`Button "${label}" not found`);
        btn.click();
    }

    function fireTransitionEnd() {
        overlay().dispatchEvent(new Event('transitionend'));
    }

    function latestWs(): MockWebSocket {
        return mockWsInstances[mockWsInstances.length - 1];
    }

    // --- Lobby menu screen ---

    it('renders the lobby overlay', () => {
        showLobby(container);
        expect(overlay()).toBeTruthy();
        expect(overlay().style.zIndex).toBe('5000');
    });

    it('shows Host Game, Join Game, and Back buttons', () => {
        showLobby(container);
        const buttons = container.querySelectorAll('button');
        const labels = Array.from(buttons).map((b) => b.textContent);
        expect(labels).toContain('Host Game');
        expect(labels).toContain('Join Game');
        expect(labels).toContain('Back');
    });

    it('resolves with "back" when Back is clicked', async () => {
        const promise = showLobby(container);
        clickButton('Back');
        fireTransitionEnd();
        expect(await promise).toBe('back');
    });

    // --- Host flow ---

    it('navigates to host setup when Host Game is clicked', () => {
        showLobby(container);
        clickButton('Host Game');
        expect(container.textContent).toContain('HOST GAME');
        expect(container.textContent).toContain('Player 1');
        expect(container.textContent).toContain('Player 2');
    });

    it('navigates to host waiting after picking player 1', () => {
        showLobby(container);
        clickButton('Host Game');
        clickButton('Player 1');
        expect(container.textContent).toContain('HOSTING');
        expect(container.textContent).toContain(
            'Share this page\u2019s URL with your opponent',
        );
    });

    it('connects WebSocket when host enters waiting screen', () => {
        showLobby(container);
        clickButton('Host Game');
        clickButton('Player 1');
        expect(mockWsInstances).toHaveLength(1);
        expect(latestWs().url).toBe('ws://localhost:5173');
    });

    it('shows waiting status after host WebSocket opens', () => {
        showLobby(container);
        clickButton('Host Game');
        clickButton('Player 1');
        latestWs().simulateOpen();
        expect(container.textContent).toContain('Waiting for opponent');
    });

    it('shows error when host cannot connect to relay server', () => {
        showLobby(container);
        clickButton('Host Game');
        clickButton('Player 1');
        latestWs().simulateError();
        expect(container.textContent).toContain(
            'Could not connect to relay server',
        );
    });

    it('Start Game button is hidden until opponent connects', () => {
        showLobby(container);
        clickButton('Host Game');
        clickButton('Player 1');
        latestWs().simulateOpen();
        const startBtn = Array.from(container.querySelectorAll('button')).find(
            (b) => b.textContent === 'Start Game',
        );
        expect(startBtn).toBeTruthy();
        expect(startBtn!.style.display).toBe('none');
    });

    it('Start Game button appears when opponent sends join-request', () => {
        showLobby(container);
        clickButton('Host Game');
        clickButton('Player 1');
        latestWs().simulateOpen();
        latestWs().simulateMessage({
            channel: 'lobby',
            data: { type: 'join-request' },
        });
        expect(container.textContent).toContain('Opponent connected');
        const startBtn = Array.from(container.querySelectorAll('button')).find(
            (b) => b.textContent === 'Start Game',
        );
        expect(startBtn!.style.display).not.toBe('none');
    });

    it('host sends host-accept when joiner connects', () => {
        showLobby(container);
        clickButton('Host Game');
        clickButton('Player 1');
        const ws = latestWs();
        ws.simulateOpen();
        ws.simulateMessage({
            channel: 'lobby',
            data: { type: 'join-request' },
        });
        const acceptMsg = ws.sent.find((s) => s.includes('host-accept'));
        expect(acceptMsg).toBeTruthy();
        const parsed = JSON.parse(acceptMsg!);
        expect(parsed.data.joinerPlayerId).toBe(1);
    });

    it('host sends lobby-full for second join-request', () => {
        showLobby(container);
        clickButton('Host Game');
        clickButton('Player 1');
        const ws = latestWs();
        ws.simulateOpen();
        ws.simulateMessage({
            channel: 'lobby',
            data: { type: 'join-request' },
        });
        ws.simulateMessage({
            channel: 'lobby',
            data: { type: 'join-request' },
        });
        const fullMsg = ws.sent.find((s) => s.includes('lobby-full'));
        expect(fullMsg).toBeTruthy();
    });

    it('resolves with host result when Start Game is clicked', async () => {
        const promise = showLobby(container);
        clickButton('Host Game');
        clickButton('Player 1');
        const ws = latestWs();
        ws.simulateOpen();
        ws.simulateMessage({
            channel: 'lobby',
            data: { type: 'join-request' },
        });
        clickButton('Start Game');
        fireTransitionEnd();

        const result = (await promise) as LobbyResult;
        expect(result).toEqual({
            mode: 'host',
            playerId: 0,
            wsUrl: 'ws://localhost:5173',
        });
    });

    it('host sends game-start before resolving', () => {
        showLobby(container);
        clickButton('Host Game');
        clickButton('Player 2');
        const ws = latestWs();
        ws.simulateOpen();
        ws.simulateMessage({
            channel: 'lobby',
            data: { type: 'join-request' },
        });
        clickButton('Start Game');
        const startMsg = ws.sent.find((s) => s.includes('game-start'));
        expect(startMsg).toBeTruthy();
    });

    it('host Back from waiting returns to host setup and closes WebSocket', () => {
        showLobby(container);
        clickButton('Host Game');
        clickButton('Player 1');
        const ws = latestWs();
        clickButton('Back');
        expect(container.textContent).toContain('HOST GAME');
        expect(ws.readyState).toBe(MockWebSocket.CLOSED);
    });

    it('host setup Back returns to lobby menu', () => {
        showLobby(container);
        clickButton('Host Game');
        clickButton('Back');
        expect(container.textContent).toContain('Host Game');
        expect(container.textContent).toContain('Join Game');
    });

    // --- Join flow ---

    it('navigates to join screen and auto-connects when Join Game is clicked', () => {
        showLobby(container);
        clickButton('Join Game');
        expect(container.textContent).toContain('JOIN GAME');
        // No IP input — connection happens automatically
        expect(container.querySelector('input')).toBeNull();
        expect(mockWsInstances).toHaveLength(1);
        expect(latestWs().url).toBe('ws://localhost:5173');
    });

    it('shows connecting status immediately after joining', () => {
        showLobby(container);
        clickButton('Join Game');
        expect(container.textContent).toContain('Connecting');
    });

    it('shows error when WebSocket connection fails', () => {
        showLobby(container);
        clickButton('Join Game');
        latestWs().simulateError();
        expect(container.textContent).toContain('Could not connect to server');
    });

    it('sends join-request after WebSocket opens', () => {
        showLobby(container);
        clickButton('Join Game');
        latestWs().simulateOpen();
        const joinMsg = latestWs().sent.find((s) => s.includes('join-request'));
        expect(joinMsg).toBeTruthy();
    });

    it('shows error on timeout if host does not respond', () => {
        showLobby(container);
        clickButton('Join Game');
        latestWs().simulateOpen();
        jest.advanceTimersByTime(5000);
        expect(container.textContent).toContain('No host found in lobby');
    });

    it('shows waiting status after host-accept', () => {
        showLobby(container);
        clickButton('Join Game');
        latestWs().simulateOpen();
        latestWs().simulateMessage({
            channel: 'lobby',
            data: { type: 'host-accept', joinerPlayerId: 1 },
        });
        expect(container.textContent).toContain('Waiting for host to start');
    });

    it('shows error when lobby is full', () => {
        showLobby(container);
        clickButton('Join Game');
        latestWs().simulateOpen();
        latestWs().simulateMessage({
            channel: 'lobby',
            data: { type: 'lobby-full' },
        });
        expect(container.textContent).toContain('Lobby is full');
    });

    it('resolves with join result on game-start', async () => {
        const promise = showLobby(container);
        clickButton('Join Game');
        latestWs().simulateOpen();
        latestWs().simulateMessage({
            channel: 'lobby',
            data: { type: 'host-accept', joinerPlayerId: 1 },
        });
        latestWs().simulateMessage({
            channel: 'lobby',
            data: { type: 'game-start' },
        });
        fireTransitionEnd();

        const result = (await promise) as LobbyResult;
        expect(result).toEqual({
            mode: 'join',
            playerId: 1,
            wsUrl: 'ws://localhost:5173',
        });
    });

    it('join Back returns to lobby menu and closes WebSocket', () => {
        showLobby(container);
        clickButton('Join Game');
        const ws = latestWs();
        ws.simulateOpen();
        clickButton('Back');
        expect(container.textContent).toContain('Host Game');
        expect(ws.readyState).toBe(MockWebSocket.CLOSED);
    });

    // --- Overlay cleanup ---

    it('removes the overlay after resolution', async () => {
        const promise = showLobby(container);
        clickButton('Back');
        fireTransitionEnd();
        await promise;
        expect(container.children).toHaveLength(0);
    });

    it('sets overlay opacity to 0 on selection', () => {
        showLobby(container);
        clickButton('Back');
        expect(overlay().style.opacity).toBe('0');
    });
});
