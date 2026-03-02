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
        // Ensure not standalone
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

    it('is a no-op on non-iOS browsers', () => {
        Object.defineProperty(navigator, 'userAgent', {
            value: 'Mozilla/5.0 Chrome/120',
            configurable: true,
        });
        const cleanup = showInstallPrompt();
        expect(document.body.children.length).toBe(0);
        cleanup();
    });

    it('shows the banner on iOS Safari', () => {
        setIosSafari();
        const cleanup = showInstallPrompt();
        const banner = document.body.querySelector('div');
        expect(banner).not.toBeNull();
        expect(banner!.textContent).toContain('Add to Home Screen');
        cleanup();
    });

    it('does not show again after dismissal', () => {
        setIosSafari();
        const cleanup1 = showInstallPrompt();
        // Click close button
        const closeBtn = document.body.querySelector('button');
        closeBtn!.click();
        cleanup1();

        // Second call should be no-op
        document.body.innerHTML = '';
        const cleanup2 = showInstallPrompt();
        expect(document.body.querySelector('div')).toBeNull();
        cleanup2();
    });

    it('removes banner on cleanup', () => {
        setIosSafari();
        const cleanup = showInstallPrompt();
        expect(document.body.querySelector('div')).not.toBeNull();
        cleanup();
        expect(document.body.querySelector('div')).toBeNull();
    });
});
