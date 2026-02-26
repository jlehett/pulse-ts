import { showWinScreen } from './GoalNode';

describe('showWinScreen', () => {
    let container: HTMLElement;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    afterEach(() => {
        document.body.removeChild(container);
    });

    it('creates overlay with heading and button', () => {
        const overlay = showWinScreen(container);

        const heading = overlay.querySelector('h1');
        expect(heading).not.toBeNull();
        expect(heading!.textContent).toBe('You Win!');

        const button = overlay.querySelector('button');
        expect(button).not.toBeNull();
        expect(button!.textContent).toBe('Play Again');
    });

    it('appends overlay to the provided container', () => {
        const overlay = showWinScreen(container);

        expect(container.contains(overlay)).toBe(true);
    });

    it('has correct positioning styles', () => {
        const overlay = showWinScreen(container);

        expect(overlay.style.position).toBe('absolute');
        expect(overlay.style.inset).toBe('0');
        expect(overlay.style.zIndex).toBe('10000');
    });

    it('has a semi-transparent backdrop', () => {
        const overlay = showWinScreen(container);

        expect(overlay.style.backgroundColor).toBe('rgba(0, 0, 0, 0.7)');
    });

    it('returns the overlay element', () => {
        const overlay = showWinScreen(container);

        expect(overlay).toBeInstanceOf(HTMLElement);
        expect(overlay.tagName).toBe('DIV');
    });
});
