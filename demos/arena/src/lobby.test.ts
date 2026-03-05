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

// ---------------------------------------------------------------------------
// RTCPeerConnection / RTCDataChannel mocks
// ---------------------------------------------------------------------------

class MockRTCDataChannel {
    readyState: RTCDataChannelState = 'connecting';
    binaryType = 'arraybuffer';
    onopen: ((ev: Event) => void) | null = null;
    onclose: ((ev: Event) => void) | null = null;
    onerror: ((ev: Event) => void) | null = null;
    onmessage: ((ev: MessageEvent) => void) | null = null;
    send = jest.fn();
    close = jest.fn();

    simulateOpen() {
        this.readyState = 'open';
        this.onopen?.({} as Event);
    }
}

let mockDataChannels: MockRTCDataChannel[] = [];

class MockRTCPeerConnection {
    connectionState = 'connected';
    localDescription: any = { type: 'offer', sdp: 'mock-sdp' };
    onicecandidate: ((ev: any) => void) | null = null;
    ondatachannel: ((ev: any) => void) | null = null;
    onconnectionstatechange: ((ev: Event) => void) | null = null;

    createDataChannel() {
        const dc = new MockRTCDataChannel();
        mockDataChannels.push(dc);
        return dc;
    }

    async createOffer() {
        return { type: 'offer', sdp: 'mock-offer-sdp' };
    }

    async createAnswer() {
        return { type: 'answer', sdp: 'mock-answer-sdp' };
    }

    async setLocalDescription(desc: any) {
        this.localDescription = desc;
    }

    async setRemoteDescription() {}
    async addIceCandidate() {}
    close = jest.fn();
}

class MockRTCSessionDescription {
    type: string;
    sdp: string;
    constructor(init: any) {
        this.type = init.type;
        this.sdp = init.sdp;
    }
}

class MockRTCIceCandidate {
    candidate: string;
    constructor(init: any) {
        this.candidate = init.candidate;
    }
}

// ---------------------------------------------------------------------------
// Global setup
// ---------------------------------------------------------------------------

beforeAll(() => {
    (globalThis as any).WebSocket = MockWebSocket;
    (globalThis as any).RTCPeerConnection = MockRTCPeerConnection;
    (globalThis as any).RTCSessionDescription = MockRTCSessionDescription;
    (globalThis as any).RTCIceCandidate = MockRTCIceCandidate;
});

afterAll(() => {
    delete (globalThis as any).WebSocket;
    delete (globalThis as any).RTCPeerConnection;
    delete (globalThis as any).RTCSessionDescription;
    delete (globalThis as any).RTCIceCandidate;
});

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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('showLobby', () => {
    let container: HTMLDivElement;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
        mockWsInstances = [];
        mockDataChannels = [];
        // Most tests assume a username is already saved
        localStorage.setItem('pulse-arena-username', 'TestUser');
    });

    afterEach(() => {
        container.remove();
        localStorage.removeItem('pulse-arena-username');
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
    });

    it('connects WebSocket to signaling server when host enters waiting', () => {
        showLobby(container);
        clickButton('Host Game');
        clickButton('Player 1');
        expect(mockWsInstances).toHaveLength(1);
        expect(latestWs().url).toBe('ws://localhost:5173');
    });

    it('sends create-lobby after signaling WebSocket opens', () => {
        showLobby(container);
        clickButton('Host Game');
        clickButton('Player 1');
        latestWs().simulateOpen();
        const createMsg = latestWs().sent.find((s) =>
            s.includes('create-lobby'),
        );
        expect(createMsg).toBeTruthy();
    });

    it('shows waiting status after lobby is created', () => {
        showLobby(container);
        clickButton('Host Game');
        clickButton('Player 1');
        latestWs().simulateOpen();
        latestWs().simulateMessage({ type: 'lobby-created', lobbyId: 'L1' });
        expect(container.textContent).toContain('Waiting for opponent');
    });

    it('shows error when host cannot connect to signaling server', () => {
        showLobby(container);
        clickButton('Host Game');
        clickButton('Player 1');
        latestWs().simulateError();
        expect(container.textContent).toContain(
            'Could not connect to signaling server',
        );
    });

    it('Start Game button is hidden until joiner connects', () => {
        showLobby(container);
        clickButton('Host Game');
        clickButton('Player 1');
        latestWs().simulateOpen();
        latestWs().simulateMessage({ type: 'lobby-created', lobbyId: 'L1' });
        const startBtn = Array.from(container.querySelectorAll('button')).find(
            (b) => b.textContent === 'Start Game',
        );
        expect(startBtn).toBeTruthy();
        expect(startBtn!.style.display).toBe('none');
    });

    it('Start Game button appears when joiner connects', () => {
        showLobby(container);
        clickButton('Host Game');
        clickButton('Player 1');
        latestWs().simulateOpen();
        latestWs().simulateMessage({ type: 'lobby-created', lobbyId: 'L1' });
        latestWs().simulateMessage({
            type: 'joiner-connected',
            joinerConnectionId: 'joiner-1',
            username: 'Bob',
        });
        expect(container.textContent).toContain('Bob joined');
        const startBtn = Array.from(container.querySelectorAll('button')).find(
            (b) => b.textContent === 'Start Game',
        );
        expect(startBtn!.style.display).not.toBe('none');
    });

    it('resolves with host result after WebRTC handshake', async () => {
        const promise = showLobby(container);
        clickButton('Host Game');
        clickButton('Player 1');
        latestWs().simulateOpen();
        latestWs().simulateMessage({ type: 'lobby-created', lobbyId: 'L1' });
        latestWs().simulateMessage({
            type: 'joiner-connected',
            joinerConnectionId: 'joiner-1',
            username: 'Bob',
        });
        clickButton('Start Game');

        // Simulate ICE servers response (TURN credentials)
        await new Promise((r) => setTimeout(r, 0));
        latestWs().simulateMessage({
            type: 'ice-servers',
            iceServers: [
                {
                    urls: ['turn:relay.example.com:443'],
                    username: 'u',
                    credential: 'p',
                },
            ],
        });

        // Wait for async operations (createOffer, setLocalDescription)
        await new Promise((r) => setTimeout(r, 0));

        // Simulate the answer from the joiner arriving
        latestWs().simulateMessage({
            type: 'signal',
            data: { type: 'answer', sdp: 'mock-answer-sdp' },
            from: 'joiner-1',
        });

        // DataChannel opens
        expect(mockDataChannels).toHaveLength(1);
        mockDataChannels[0].simulateOpen();

        // Wait for resolution
        await new Promise((r) => setTimeout(r, 0));

        fireTransitionEnd();
        const result = (await promise) as LobbyResult;
        expect(result.mode).toBe('host');
        expect(result.playerId).toBe(0);
        expect(result.transport).toBeTruthy();
    });

    it('host sends game-start and signal offer when Start is clicked', async () => {
        showLobby(container);
        clickButton('Host Game');
        clickButton('Player 2');
        latestWs().simulateOpen();
        latestWs().simulateMessage({ type: 'lobby-created', lobbyId: 'L1' });
        latestWs().simulateMessage({
            type: 'joiner-connected',
            joinerConnectionId: 'joiner-1',
            username: 'Bob',
        });
        clickButton('Start Game');

        // Simulate ICE servers response
        await new Promise((r) => setTimeout(r, 0));
        latestWs().simulateMessage({
            type: 'ice-servers',
            iceServers: [],
        });

        await new Promise((r) => setTimeout(r, 0));

        const startMsg = latestWs().sent.find((s) => s.includes('game-start'));
        expect(startMsg).toBeTruthy();

        const signalMsg = latestWs().sent.find((s) => s.includes('signal'));
        expect(signalMsg).toBeTruthy();
    });

    it('host Back from waiting sends leave-lobby and returns to setup', () => {
        showLobby(container);
        clickButton('Host Game');
        clickButton('Player 1');
        const ws = latestWs();
        ws.simulateOpen();
        clickButton('Back');
        expect(container.textContent).toContain('HOST GAME');
        const leaveMsg = ws.sent.find((s) => s.includes('leave-lobby'));
        expect(leaveMsg).toBeTruthy();
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

    it('navigates to join browser when Join Game is clicked', () => {
        showLobby(container);
        clickButton('Join Game');
        expect(container.textContent).toContain('JOIN GAME');
        expect(mockWsInstances).toHaveLength(1);
    });

    it('requests lobby list after connecting', () => {
        showLobby(container);
        clickButton('Join Game');
        latestWs().simulateOpen();
        const listMsg = latestWs().sent.find((s) => s.includes('list-lobbies'));
        expect(listMsg).toBeTruthy();
    });

    it('shows error when signaling connection fails', () => {
        showLobby(container);
        clickButton('Join Game');
        latestWs().simulateError();
        expect(container.textContent).toContain(
            'Could not connect to signaling server',
        );
    });

    it('shows message when no lobbies available', () => {
        showLobby(container);
        clickButton('Join Game');
        latestWs().simulateOpen();
        latestWs().simulateMessage({ type: 'lobby-list', lobbies: [] });
        expect(container.textContent).toContain('No lobbies available');
    });

    it('renders lobby buttons from lobby list', () => {
        showLobby(container);
        clickButton('Join Game');
        latestWs().simulateOpen();
        latestWs().simulateMessage({
            type: 'lobby-list',
            lobbies: [
                { lobbyId: 'L1', hostUsername: 'Alice' },
                { lobbyId: 'L2', hostUsername: 'Bob' },
            ],
        });
        expect(container.textContent).toContain("Alice's Game");
        expect(container.textContent).toContain("Bob's Game");
    });

    it('sends join-lobby when a lobby is clicked', () => {
        showLobby(container);
        clickButton('Join Game');
        latestWs().simulateOpen();
        latestWs().simulateMessage({
            type: 'lobby-list',
            lobbies: [{ lobbyId: 'L1', hostUsername: 'Alice' }],
        });
        clickButton("Alice's Game");
        const joinMsg = latestWs().sent.find((s) => s.includes('join-lobby'));
        expect(joinMsg).toBeTruthy();
        const parsed = JSON.parse(joinMsg!);
        expect(parsed.lobbyId).toBe('L1');
    });

    it('shows join-failed error', () => {
        showLobby(container);
        clickButton('Join Game');
        latestWs().simulateOpen();
        latestWs().simulateMessage({
            type: 'lobby-list',
            lobbies: [{ lobbyId: 'L1', hostUsername: 'Alice' }],
        });
        clickButton("Alice's Game");
        latestWs().simulateMessage({
            type: 'join-failed',
            reason: 'Lobby is no longer available',
        });
        expect(container.textContent).toContain('Lobby is no longer available');
    });

    it('join Back returns to lobby menu', () => {
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

    // --- Username system ---

    it('shows username prompt when no username is saved', () => {
        localStorage.removeItem('pulse-arena-username');
        showLobby(container);
        expect(container.textContent).toContain('ENTER YOUR NAME');
        expect(container.querySelector('input')).toBeTruthy();
    });

    it('goes to lobby menu after entering username', () => {
        localStorage.removeItem('pulse-arena-username');
        showLobby(container);

        const input = container.querySelector('input')!;
        input.value = 'Alice';
        clickButton('Continue');

        expect(localStorage.getItem('pulse-arena-username')).toBe('Alice');
        expect(container.textContent).toContain('ONLINE PLAY');
        expect(container.textContent).toContain('Playing as: Alice');
    });

    it('shows error when trying to confirm empty username', () => {
        localStorage.removeItem('pulse-arena-username');
        showLobby(container);

        const input = container.querySelector('input')!;
        input.value = '';
        clickButton('Continue');

        expect(container.textContent).toContain('Name cannot be empty');
        // Should still be on the prompt screen
        expect(container.textContent).toContain('ENTER YOUR NAME');
    });

    it('resolves with back from username prompt when Back is clicked', async () => {
        localStorage.removeItem('pulse-arena-username');
        const promise = showLobby(container);
        clickButton('Back');
        fireTransitionEnd();
        expect(await promise).toBe('back');
    });

    it('displays current username in lobby menu', () => {
        localStorage.setItem('pulse-arena-username', 'Bob');
        showLobby(container);
        expect(container.textContent).toContain('Playing as: Bob');
    });

    it('shows Change Name button in lobby menu', () => {
        showLobby(container);
        const buttons = container.querySelectorAll('button');
        const labels = Array.from(buttons).map((b) => b.textContent);
        expect(labels).toContain('Change Name');
    });

    it('navigates to name edit screen when Change Name is clicked', () => {
        showLobby(container);
        clickButton('Change Name');
        expect(container.textContent).toContain('CHANGE NAME');
        const input = container.querySelector('input')!;
        expect(input.value).toBe('TestUser');
    });

    it('updates username and returns to lobby menu after saving', () => {
        showLobby(container);
        clickButton('Change Name');

        const input = container.querySelector('input')!;
        input.value = 'NewName';
        clickButton('Save');

        expect(localStorage.getItem('pulse-arena-username')).toBe('NewName');
        expect(container.textContent).toContain('Playing as: NewName');
        expect(container.textContent).toContain('ONLINE PLAY');
    });

    it('returns to lobby menu from name edit via Back without changing name', () => {
        showLobby(container);
        clickButton('Change Name');
        clickButton('Back');
        expect(container.textContent).toContain('ONLINE PLAY');
        expect(localStorage.getItem('pulse-arena-username')).toBe('TestUser');
    });

    it('trims and limits username to 24 characters', () => {
        localStorage.removeItem('pulse-arena-username');
        showLobby(container);

        const input = container.querySelector('input')!;
        input.value = '  ' + 'A'.repeat(30) + '  ';
        clickButton('Continue');

        const saved = localStorage.getItem('pulse-arena-username')!;
        expect(saved.length).toBeLessThanOrEqual(24);
        expect(saved).not.toMatch(/^\s|\s$/);
    });

    it('submits username on Enter key', () => {
        localStorage.removeItem('pulse-arena-username');
        showLobby(container);

        const input = container.querySelector('input')!;
        input.value = 'EnterUser';
        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

        expect(localStorage.getItem('pulse-arena-username')).toBe('EnterUser');
        expect(container.textContent).toContain('ONLINE PLAY');
    });

    it('sends username in create-lobby message', () => {
        localStorage.setItem('pulse-arena-username', 'HostPlayer');
        showLobby(container);
        clickButton('Host Game');
        clickButton('Player 1');
        latestWs().simulateOpen();
        const createMsg = latestWs().sent.find((s) =>
            s.includes('create-lobby'),
        );
        expect(createMsg).toBeTruthy();
        const parsed = JSON.parse(createMsg!);
        expect(parsed.username).toBe('HostPlayer');
    });
});
