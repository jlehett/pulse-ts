import { initLandscapeEnforcer } from './landscapeEnforcer';

// ── Test helpers ──

let orientationChangeHandler: (() => void) | null = null;

/**
 * Install a matchMedia mock that handles both `(pointer: coarse)` for
 * isMobileDevice() and `(orientation: portrait)` for the enforcer.
 */
function installMatchMedia(opts: { mobile: boolean; portrait: boolean }) {
    const orientationQuery = {
        matches: opts.portrait,
        addEventListener: jest.fn((_event: string, handler: () => void) => {
            orientationChangeHandler = handler;
        }),
        removeEventListener: jest.fn(),
        media: '(orientation: portrait)',
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        dispatchEvent: jest.fn(),
    } as unknown as MediaQueryList;

    const coarseQuery = {
        matches: opts.mobile,
    } as unknown as MediaQueryList;

    window.matchMedia = jest.fn((query: string) => {
        if (query === '(pointer: coarse)') return coarseQuery;
        return orientationQuery;
    });

    return orientationQuery;
}

function setPortrait(query: MediaQueryList, val: boolean) {
    (query as unknown as { matches: boolean }).matches = val;
    orientationChangeHandler?.();
}

describe('initLandscapeEnforcer', () => {
    beforeEach(() => {
        orientationChangeHandler = null;
    });

    afterEach(() => {
        document.body.innerHTML = '';
        jest.restoreAllMocks();
    });

    it('returns a no-op cleanup on desktop', () => {
        installMatchMedia({ mobile: false, portrait: false });
        const cleanup = initLandscapeEnforcer();
        expect(document.body.children.length).toBe(0);
        cleanup(); // should not throw
    });

    it('creates the overlay on mobile devices', () => {
        installMatchMedia({ mobile: true, portrait: false });
        const cleanup = initLandscapeEnforcer();
        const overlay = document.body.querySelector('div');
        expect(overlay).not.toBeNull();
        cleanup();
    });

    it('shows overlay when in portrait mode', () => {
        installMatchMedia({ mobile: true, portrait: true });
        const cleanup = initLandscapeEnforcer();
        const overlay = document.body.querySelector('div') as HTMLElement;
        expect(overlay.style.display).toBe('flex');
        cleanup();
    });

    it('hides overlay when in landscape mode', () => {
        installMatchMedia({ mobile: true, portrait: false });
        const cleanup = initLandscapeEnforcer();
        const overlay = document.body.querySelector('div') as HTMLElement;
        expect(overlay.style.display).toBe('none');
        cleanup();
    });

    it('reacts to orientation changes', () => {
        const query = installMatchMedia({ mobile: true, portrait: false });
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
        const query = installMatchMedia({ mobile: true, portrait: false });
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
        installMatchMedia({ mobile: true, portrait: false });

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
        installMatchMedia({ mobile: true, portrait: false });

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
