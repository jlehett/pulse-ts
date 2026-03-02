import { isIosSafari, showInstallPrompt } from './installPrompt';

describe('isIosSafari', () => {
    let originalUA: string;

    beforeEach(() => {
        originalUA = navigator.userAgent;
    });

    afterEach(() => {
        Object.defineProperty(navigator, 'userAgent', {
            value: originalUA,
            configurable: true,
        });
    });

    it('returns false for desktop user agents', () => {
        Object.defineProperty(navigator, 'userAgent', {
            value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X) AppleWebKit/537.36 Chrome/120',
            configurable: true,
        });
        expect(isIosSafari()).toBe(false);
    });

    it('returns true for iPhone Safari', () => {
        Object.defineProperty(navigator, 'userAgent', {
            value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
            configurable: true,
        });
        Object.defineProperty(navigator, 'standalone', {
            value: false,
            configurable: true,
        });
        window.matchMedia = jest.fn().mockReturnValue({ matches: false });
        expect(isIosSafari()).toBe(true);
    });

    it('returns false for Chrome on iOS', () => {
        Object.defineProperty(navigator, 'userAgent', {
            value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120 Mobile/15E148 Safari/604.1',
            configurable: true,
        });
        expect(isIosSafari()).toBe(false);
    });

    it('returns false when in standalone mode', () => {
        Object.defineProperty(navigator, 'userAgent', {
            value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
            configurable: true,
        });
        Object.defineProperty(navigator, 'standalone', {
            value: true,
            configurable: true,
        });
        expect(isIosSafari()).toBe(false);
    });
});

describe('showInstallPrompt', () => {
    let originalUA: string;

    beforeEach(() => {
        originalUA = navigator.userAgent;
        localStorage.clear();
    });

    afterEach(() => {
        Object.defineProperty(navigator, 'userAgent', {
            value: originalUA,
            configurable: true,
        });
        document.body.innerHTML = '';
    });

    function setIosSafari() {
        Object.defineProperty(navigator, 'userAgent', {
            value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
            configurable: true,
        });
        Object.defineProperty(navigator, 'standalone', {
            value: false,
            configurable: true,
        });
        window.matchMedia = jest.fn().mockReturnValue({ matches: false });
    }

    function setDesktop() {
        Object.defineProperty(navigator, 'userAgent', {
            value: 'Mozilla/5.0 Chrome/120',
            configurable: true,
        });
    }

    it('is a no-op on non-iOS desktop browsers without beforeinstallprompt', () => {
        setDesktop();
        const cleanup = showInstallPrompt();
        expect(document.body.querySelector('div')).toBeNull();
        cleanup();
    });

    it('shows the iOS banner on iOS Safari', () => {
        setIosSafari();
        const cleanup = showInstallPrompt();
        const banner = document.body.querySelector('div');
        expect(banner).not.toBeNull();
        expect(banner!.textContent).toContain('Add to Home Screen');
        cleanup();
    });

    it('does not show again after dismissal (iOS)', () => {
        setIosSafari();
        const cleanup1 = showInstallPrompt();
        const closeBtn = document.body.querySelector('button');
        closeBtn!.click();
        cleanup1();

        document.body.innerHTML = '';
        const cleanup2 = showInstallPrompt();
        expect(document.body.querySelector('div')).toBeNull();
        cleanup2();
    });

    it('removes iOS banner on cleanup', () => {
        setIosSafari();
        const cleanup = showInstallPrompt();
        expect(document.body.querySelector('div')).not.toBeNull();
        cleanup();
        expect(document.body.querySelector('div')).toBeNull();
    });

    it('shows Android banner when beforeinstallprompt fires', () => {
        setDesktop();
        const cleanup = showInstallPrompt();

        // Simulate beforeinstallprompt event
        const event = new Event('beforeinstallprompt', {
            cancelable: true,
        });
        (event as any).prompt = jest.fn().mockResolvedValue(undefined);
        (event as any).userChoice = Promise.resolve({
            outcome: 'dismissed' as const,
        });
        window.dispatchEvent(event);

        const banner = document.body.querySelector('div');
        expect(banner).not.toBeNull();
        expect(banner!.textContent).toContain('Install');
        cleanup();
    });

    it('calls prompt() when Android Install button is clicked', () => {
        setDesktop();
        const cleanup = showInstallPrompt();

        const promptFn = jest.fn().mockResolvedValue(undefined);
        const event = new Event('beforeinstallprompt', {
            cancelable: true,
        });
        (event as any).prompt = promptFn;
        (event as any).userChoice = Promise.resolve({
            outcome: 'accepted' as const,
        });
        window.dispatchEvent(event);

        // Find the Install button (not the close button)
        const buttons = document.body.querySelectorAll('button');
        const installBtn = Array.from(buttons).find(
            (b) => b.textContent === 'Install',
        );
        expect(installBtn).toBeDefined();
        installBtn!.click();

        expect(promptFn).toHaveBeenCalled();
        cleanup();
    });

    it('does not show Android banner if previously dismissed', () => {
        setDesktop();
        localStorage.setItem('pulse-install-prompt-dismissed', '1');

        const cleanup = showInstallPrompt();

        const event = new Event('beforeinstallprompt', {
            cancelable: true,
        });
        (event as any).prompt = jest.fn();
        (event as any).userChoice = Promise.resolve({
            outcome: 'dismissed' as const,
        });
        window.dispatchEvent(event);

        expect(document.body.querySelector('div')).toBeNull();
        cleanup();
    });

    it('removes Android listener on cleanup', () => {
        setDesktop();
        const removeSpy = jest.spyOn(window, 'removeEventListener');
        const cleanup = showInstallPrompt();
        cleanup();

        expect(removeSpy).toHaveBeenCalledWith(
            'beforeinstallprompt',
            expect.any(Function),
        );
        removeSpy.mockRestore();
    });
});
