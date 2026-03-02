import { isMobileDevice } from './isMobileDevice';

describe('isMobileDevice', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('returns true when pointer is coarse (phone/tablet)', () => {
        window.matchMedia = jest.fn().mockReturnValue({ matches: true });
        expect(isMobileDevice()).toBe(true);
        expect(window.matchMedia).toHaveBeenCalledWith('(pointer: coarse)');
    });

    it('returns false when pointer is fine (desktop/laptop)', () => {
        window.matchMedia = jest.fn().mockReturnValue({ matches: false });
        expect(isMobileDevice()).toBe(false);
    });

    it('falls back to maxTouchPoints when matchMedia is unavailable', () => {
        // Remove matchMedia
        const original = window.matchMedia;
        (window as any).matchMedia = undefined;

        Object.defineProperty(navigator, 'maxTouchPoints', {
            value: 5,
            configurable: true,
        });
        expect(isMobileDevice()).toBe(true);

        Object.defineProperty(navigator, 'maxTouchPoints', {
            value: 0,
            configurable: true,
        });
        expect(isMobileDevice()).toBe(false);

        window.matchMedia = original;
    });
});
