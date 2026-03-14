import { installMobileSupport } from './installMobileSupport';

describe('installMobileSupport', () => {
    let addEventSpy: jest.SpyInstance;

    beforeEach(() => {
        addEventSpy = jest.spyOn(document, 'addEventListener');
    });

    afterEach(() => {
        jest.restoreAllMocks();
        document
            .querySelectorAll('[data-pulse-rotate-overlay]')
            .forEach((el) => el.remove());
        document
            .querySelectorAll('[data-pulse-install-banner]')
            .forEach((el) => el.remove());
        localStorage.clear();
    });

    it('returns a cleanup function', () => {
        const cleanup = installMobileSupport();
        expect(typeof cleanup).toBe('function');
        cleanup();
    });

    // -- Fullscreen ---------------------------------------------------------

    describe('fullscreen', () => {
        it('adds a touchstart listener by default', () => {
            const cleanup = installMobileSupport();
            expect(addEventSpy).toHaveBeenCalledWith(
                'touchstart',
                expect.any(Function),
                { once: true },
            );
            cleanup();
        });

        it('does not add touchstart when fullscreen is false', () => {
            const cleanup = installMobileSupport({ fullscreen: false });
            expect(addEventSpy).not.toHaveBeenCalledWith(
                'touchstart',
                expect.any(Function),
                expect.anything(),
            );
            cleanup();
        });

        it('calls requestFullscreen on touchstart', () => {
            const mockRequestFullscreen = jest
                .fn()
                .mockResolvedValue(undefined);
            Object.defineProperty(
                document.documentElement,
                'requestFullscreen',
                {
                    value: mockRequestFullscreen,
                    configurable: true,
                    writable: true,
                },
            );

            const cleanup = installMobileSupport({ fullscreen: true });

            // Simulate touchstart
            const event = new Event('touchstart');
            document.dispatchEvent(event);

            expect(mockRequestFullscreen).toHaveBeenCalled();
            cleanup();
        });
    });

    // -- Orientation --------------------------------------------------------

    describe('orientation', () => {
        it('does not create overlay when orientation is "any" (default)', () => {
            const cleanup = installMobileSupport();
            expect(
                document.querySelector('[data-pulse-rotate-overlay]'),
            ).toBeNull();
            cleanup();
        });

        it('creates a rotate overlay when orientation is "landscape"', () => {
            const cleanup = installMobileSupport({ orientation: 'landscape' });
            const overlay = document.querySelector(
                '[data-pulse-rotate-overlay]',
            );
            expect(overlay).not.toBeNull();
            expect(overlay!.textContent).toContain('landscape');
            cleanup();
        });

        it('creates a rotate overlay when orientation is "portrait"', () => {
            const cleanup = installMobileSupport({ orientation: 'portrait' });
            const overlay = document.querySelector(
                '[data-pulse-rotate-overlay]',
            );
            expect(overlay).not.toBeNull();
            expect(overlay!.textContent).toContain('portrait');
            cleanup();
        });

        it('removes overlay on cleanup', () => {
            const cleanup = installMobileSupport({ orientation: 'landscape' });
            expect(
                document.querySelector('[data-pulse-rotate-overlay]'),
            ).not.toBeNull();
            cleanup();
            expect(
                document.querySelector('[data-pulse-rotate-overlay]'),
            ).toBeNull();
        });

        it('shows overlay when orientation is wrong', () => {
            // jsdom defaults to 1024x768 (landscape)
            const cleanup = installMobileSupport({ orientation: 'portrait' });
            const overlay = document.querySelector(
                '[data-pulse-rotate-overlay]',
            ) as HTMLElement;
            // Width > height means landscape, so portrait overlay should show
            expect(overlay.style.display).toBe('flex');
            cleanup();
        });
    });

    // -- Install prompt -----------------------------------------------------

    describe('installPrompt', () => {
        it('does not set up install prompt by default', () => {
            const windowAddEvent = jest.spyOn(globalThis, 'addEventListener');
            const cleanup = installMobileSupport();
            expect(windowAddEvent).not.toHaveBeenCalledWith(
                'beforeinstallprompt',
                expect.any(Function),
            );
            cleanup();
            windowAddEvent.mockRestore();
        });

        it('listens for beforeinstallprompt when enabled', () => {
            const windowAddEvent = jest.spyOn(globalThis, 'addEventListener');
            const cleanup = installMobileSupport({ installPrompt: true });
            expect(windowAddEvent).toHaveBeenCalledWith(
                'beforeinstallprompt',
                expect.any(Function),
            );
            cleanup();
            windowAddEvent.mockRestore();
        });

        it('does not show banner if dismiss key is set in localStorage', () => {
            localStorage.setItem('pulse-install-prompt-dismissed', '1');
            const windowAddEvent = jest.spyOn(globalThis, 'addEventListener');
            const cleanup = installMobileSupport({ installPrompt: true });
            // Should not have registered the beforeinstallprompt listener
            expect(windowAddEvent).not.toHaveBeenCalledWith(
                'beforeinstallprompt',
                expect.any(Function),
            );
            cleanup();
            windowAddEvent.mockRestore();
        });

        it('uses a custom dismiss key', () => {
            localStorage.setItem('my-key', '1');
            const windowAddEvent = jest.spyOn(globalThis, 'addEventListener');
            const cleanup = installMobileSupport({
                installPrompt: true,
                installPromptDismissKey: 'my-key',
            });
            expect(windowAddEvent).not.toHaveBeenCalledWith(
                'beforeinstallprompt',
                expect.any(Function),
            );
            cleanup();
            windowAddEvent.mockRestore();
        });

        it('shows install banner on beforeinstallprompt event', () => {
            const cleanup = installMobileSupport({ installPrompt: true });

            const event = new Event('beforeinstallprompt', {
                cancelable: true,
            });
            (event as Event & { prompt: () => Promise<void> }).prompt = jest
                .fn()
                .mockResolvedValue(undefined);
            globalThis.dispatchEvent(event);

            const banner = document.querySelector(
                '[data-pulse-install-banner]',
            );
            expect(banner).not.toBeNull();
            expect(banner!.textContent).toContain('Install');

            cleanup();
        });

        it('removes banner on cleanup', () => {
            const cleanup = installMobileSupport({ installPrompt: true });

            const event = new Event('beforeinstallprompt', {
                cancelable: true,
            });
            (event as Event & { prompt: () => Promise<void> }).prompt = jest
                .fn()
                .mockResolvedValue(undefined);
            globalThis.dispatchEvent(event);

            expect(
                document.querySelector('[data-pulse-install-banner]'),
            ).not.toBeNull();
            cleanup();
            expect(
                document.querySelector('[data-pulse-install-banner]'),
            ).toBeNull();
        });
    });

    // -- Combined -----------------------------------------------------------

    it('supports all options together', () => {
        const cleanup = installMobileSupport({
            fullscreen: true,
            orientation: 'landscape',
            installPrompt: true,
        });
        expect(typeof cleanup).toBe('function');
        cleanup();
    });

    it('works with no options (defaults)', () => {
        const cleanup = installMobileSupport();
        expect(typeof cleanup).toBe('function');
        cleanup();
    });
});
