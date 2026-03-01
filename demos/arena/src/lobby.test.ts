import { showLobby, type LobbyResult } from './lobby';

describe('showLobby', () => {
    let container: HTMLDivElement;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    afterEach(() => {
        container.remove();
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
        expect(container.textContent).toContain('8080');
    });

    it('navigates to host waiting after picking player 2', () => {
        showLobby(container);
        clickButton('Host Game');
        clickButton('Player 2');
        expect(container.textContent).toContain('HOSTING');
    });

    it('resolves with host result when Start is clicked (P1)', async () => {
        const promise = showLobby(container);
        clickButton('Host Game');
        clickButton('Player 1');
        clickButton('Start');
        fireTransitionEnd();

        const result = (await promise) as LobbyResult;
        expect(result).toEqual({
            mode: 'host',
            playerId: 0,
            wsUrl: 'ws://localhost:8080',
        });
    });

    it('resolves with host result when Start is clicked (P2)', async () => {
        const promise = showLobby(container);
        clickButton('Host Game');
        clickButton('Player 2');
        clickButton('Start');
        fireTransitionEnd();

        const result = (await promise) as LobbyResult;
        expect(result).toEqual({
            mode: 'host',
            playerId: 1,
            wsUrl: 'ws://localhost:8080',
        });
    });

    it('host Back returns to host setup', () => {
        showLobby(container);
        clickButton('Host Game');
        clickButton('Player 1');
        clickButton('Back');
        expect(container.textContent).toContain('HOST GAME');
        expect(container.textContent).toContain('Player 1');
    });

    it('host setup Back returns to lobby menu', () => {
        showLobby(container);
        clickButton('Host Game');
        clickButton('Back');
        expect(container.textContent).toContain('Host Game');
        expect(container.textContent).toContain('Join Game');
    });

    // --- Join flow ---

    it('navigates to join setup when Join Game is clicked', () => {
        showLobby(container);
        clickButton('Join Game');
        expect(container.textContent).toContain('JOIN GAME');
        const input = container.querySelector('input');
        expect(input).toBeTruthy();
        expect(input!.placeholder).toBe('192.168.1.x');
    });

    it('shows error when Connect is clicked with empty address', () => {
        showLobby(container);
        clickButton('Join Game');
        clickButton('Connect');
        expect(container.textContent).toContain('Enter a host address');
    });

    it('resolves with join result when address is entered and Connect clicked', async () => {
        const promise = showLobby(container);
        clickButton('Join Game');

        const input = container.querySelector('input')!;
        input.value = '192.168.1.50';

        clickButton('Connect');
        fireTransitionEnd();

        const result = (await promise) as LobbyResult;
        expect(result).toEqual({
            mode: 'join',
            wsUrl: 'ws://192.168.1.50:8080',
        });
    });

    it('join Back returns to lobby menu', () => {
        showLobby(container);
        clickButton('Join Game');
        clickButton('Back');
        expect(container.textContent).toContain('Host Game');
        expect(container.textContent).toContain('Join Game');
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
