import { initLandscapeEnforcer } from './landscapeEnforcer';

// ── Test helpers ──

let changeHandler: (() => void) | null = null;

function installMatchMedia(portrait: boolean) {
    const query = {
        matches: portrait,
        addEventListener: jest.fn((_event: string, handler: () => void) => {
            changeHandler = handler;
        }),
        removeEventListener: jest.fn(),
        media: '',
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        dispatchEvent: jest.fn(),
    } as unknown as MediaQueryList;

    window.matchMedia = jest.fn().mockReturnValue(query);
    return query;
}

function setPortrait(query: MediaQueryList, val: boolean) {
    (query as unknown as { matches: boolean }).matches = val;
    changeHandler?.();
}

describe('initLandscapeEnforcer', () => {
    let originalMaxTouchPoints: number;

    beforeEach(() => {
        originalMaxTouchPoints = navigator.maxTouchPoints;
        changeHandler = null;
    });

    afterEach(() => {
        Object.defineProperty(navigator, 'maxTouchPoints', {
            value: originalMaxTouchPoints,
            configurable: true,
        });
        document.body.innerHTML = '';
        jest.restoreAllMocks();
    });

    it('returns a no-op cleanup on desktop (no touch)', () => {
        Object.defineProperty(navigator, 'maxTouchPoints', {
            value: 0,
            configurable: true,
        });
        const cleanup = initLandscapeEnforcer();
        expect(document.body.children.length).toBe(0);
        cleanup(); // should not throw
    });

    it('creates the overlay on touch devices', () => {
        Object.defineProperty(navigator, 'maxTouchPoints', {
            value: 1,
            configurable: true,
        });
        installMatchMedia(false);
        const cleanup = initLandscapeEnforcer();
        const overlay = document.body.querySelector('div');
        expect(overlay).not.toBeNull();
        cleanup();
    });

    it('shows overlay when in portrait mode', () => {
        Object.defineProperty(navigator, 'maxTouchPoints', {
            value: 1,
            configurable: true,
        });
        installMatchMedia(true);
        const cleanup = initLandscapeEnforcer();
        const overlay = document.body.querySelector('div') as HTMLElement;
        expect(overlay.style.display).toBe('flex');
        cleanup();
    });

    it('hides overlay when in landscape mode', () => {
        Object.defineProperty(navigator, 'maxTouchPoints', {
            value: 1,
            configurable: true,
        });
        installMatchMedia(false);
        const cleanup = initLandscapeEnforcer();
        const overlay = document.body.querySelector('div') as HTMLElement;
        expect(overlay.style.display).toBe('none');
        cleanup();
    });

    it('reacts to orientation changes', () => {
        Object.defineProperty(navigator, 'maxTouchPoints', {
            value: 1,
            configurable: true,
        });
        const query = installMatchMedia(false);
        const cleanup = initLandscapeEnforcer();
        const overlay = document.body.querySelector('div') as HTMLElement;

        expect(overlay.style.display).toBe('none');

        // Simulate rotation to portrait
        setPortrait(query, true);
        expect(overlay.style.display).toBe('flex');

        // Simulate rotation back to landscape
        setPortrait(query, false);
        expect(overlay.style.display).toBe('none');

        cleanup();
    });

    it('removes overlay and listeners on cleanup', () => {
        Object.defineProperty(navigator, 'maxTouchPoints', {
            value: 1,
            configurable: true,
        });
        const query = installMatchMedia(false);
        const cleanup = initLandscapeEnforcer();

        expect(document.body.querySelector('div')).not.toBeNull();
        cleanup();
        expect(document.body.querySelector('div')).toBeNull();
        expect(
            (query as unknown as { removeEventListener: jest.Mock })
                .removeEventListener,
        ).toHaveBeenCalledWith('change', expect.any(Function));
    });

    it('attempts orientation lock on fullscreen change', () => {
        Object.defineProperty(navigator, 'maxTouchPoints', {
            value: 1,
            configurable: true,
        });
        installMatchMedia(false);

        const lockFn = jest.fn().mockResolvedValue(undefined);
        Object.defineProperty(screen, 'orientation', {
            value: { lock: lockFn },
            configurable: true,
        });

        const cleanup = initLandscapeEnforcer();

        // Simulate entering fullscreen
        Object.defineProperty(document, 'fullscreenElement', {
            value: document.body,
            configurable: true,
        });
        document.dispatchEvent(new Event('fullscreenchange'));

        expect(lockFn).toHaveBeenCalledWith('landscape');

        // Restore
        Object.defineProperty(document, 'fullscreenElement', {
            value: null,
            configurable: true,
        });
        cleanup();
    });

    it('does not throw when orientation lock is unsupported', () => {
        Object.defineProperty(navigator, 'maxTouchPoints', {
            value: 1,
            configurable: true,
        });
        installMatchMedia(false);

        Object.defineProperty(screen, 'orientation', {
            value: {},
            configurable: true,
        });

        expect(() => {
            const cleanup = initLandscapeEnforcer();
            cleanup();
        }).not.toThrow();
    });
});
