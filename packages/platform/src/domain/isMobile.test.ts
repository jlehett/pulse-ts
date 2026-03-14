import { isMobile } from './isMobile';

describe('isMobile', () => {
    const originalNavigator = globalThis.navigator;

    function mockNavigator(
        userAgent: string,
        maxTouchPoints: number,
        hasOntouchstart = false,
    ) {
        Object.defineProperty(globalThis, 'navigator', {
            value: { userAgent, maxTouchPoints },
            writable: true,
            configurable: true,
        });
        if (hasOntouchstart) {
            (globalThis as Record<string, unknown>).ontouchstart = null;
        } else {
            delete (globalThis as Record<string, unknown>).ontouchstart;
        }
    }

    afterEach(() => {
        Object.defineProperty(globalThis, 'navigator', {
            value: originalNavigator,
            writable: true,
            configurable: true,
        });
        delete (globalThis as Record<string, unknown>).ontouchstart;
    });

    it('returns true for an Android phone with touch support', () => {
        mockNavigator(
            'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/114 Mobile',
            5,
            true,
        );
        expect(isMobile()).toBe(true);
    });

    it('returns true for an iPhone', () => {
        mockNavigator(
            'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0) AppleWebKit/605.1.15',
            5,
            true,
        );
        expect(isMobile()).toBe(true);
    });

    it('returns true for an iPad', () => {
        mockNavigator(
            'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
            5,
            true,
        );
        expect(isMobile()).toBe(true);
    });

    it('returns false for a desktop browser', () => {
        mockNavigator(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/114',
            0,
            false,
        );
        expect(isMobile()).toBe(false);
    });

    it('returns false when navigator is undefined', () => {
        Object.defineProperty(globalThis, 'navigator', {
            value: undefined,
            writable: true,
            configurable: true,
        });
        expect(isMobile()).toBe(false);
    });

    it('returns false for a mobile user agent without touch support', () => {
        mockNavigator(
            'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/114 Mobile',
            0,
            false,
        );
        expect(isMobile()).toBe(false);
    });

    it('returns false for a desktop with touch support but no mobile UA', () => {
        mockNavigator(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/114',
            10,
            true,
        );
        expect(isMobile()).toBe(false);
    });
});
