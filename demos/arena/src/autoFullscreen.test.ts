import { initAutoFullscreen } from './autoFullscreen';

function mockMobile(mobile: boolean) {
    window.matchMedia = jest
        .fn()
        .mockReturnValue({ matches: mobile } as unknown as MediaQueryList);
}

describe('initAutoFullscreen', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('returns a no-op cleanup on desktop', () => {
        mockMobile(false);
        const addSpy = jest.spyOn(document, 'addEventListener');
        const cleanup = initAutoFullscreen();
        expect(addSpy).not.toHaveBeenCalledWith(
            'touchstart',
            expect.any(Function),
            expect.anything(),
        );
        cleanup(); // should not throw
    });

    it('registers a touchstart listener on mobile devices', () => {
        mockMobile(true);
        const addSpy = jest.spyOn(document, 'addEventListener');
        const cleanup = initAutoFullscreen();

        expect(addSpy).toHaveBeenCalledWith(
            'touchstart',
            expect.any(Function),
            expect.objectContaining({ capture: true, passive: true }),
        );
        cleanup();
    });

    it('requests fullscreen on first touch', () => {
        mockMobile(true);
        const requestFn = jest.fn().mockResolvedValue(undefined);
        document.documentElement.requestFullscreen = requestFn;

        const cleanup = initAutoFullscreen();

        // Simulate touchstart
        document.dispatchEvent(new Event('touchstart', { bubbles: true }));

        expect(requestFn).toHaveBeenCalled();
        cleanup();
    });

    it('only fires once (one-shot listener)', () => {
        mockMobile(true);
        const requestFn = jest.fn().mockResolvedValue(undefined);
        document.documentElement.requestFullscreen = requestFn;

        const cleanup = initAutoFullscreen();

        document.dispatchEvent(new Event('touchstart', { bubbles: true }));
        document.dispatchEvent(new Event('touchstart', { bubbles: true }));

        expect(requestFn).toHaveBeenCalledTimes(1);
        cleanup();
    });

    it('does not throw when requestFullscreen is unavailable', () => {
        mockMobile(true);
        // Remove requestFullscreen
        const original = document.documentElement.requestFullscreen;
        (document.documentElement as any).requestFullscreen = undefined;

        const cleanup = initAutoFullscreen();

        expect(() => {
            document.dispatchEvent(new Event('touchstart', { bubbles: true }));
        }).not.toThrow();

        document.documentElement.requestFullscreen = original;
        cleanup();
    });

    it('removes listener on cleanup before touch fires', () => {
        mockMobile(true);
        const requestFn = jest.fn().mockResolvedValue(undefined);
        document.documentElement.requestFullscreen = requestFn;

        const removeSpy = jest.spyOn(document, 'removeEventListener');
        const cleanup = initAutoFullscreen();
        cleanup();

        expect(removeSpy).toHaveBeenCalledWith(
            'touchstart',
            expect.any(Function),
            true,
        );

        // Touch after cleanup should not request fullscreen
        document.dispatchEvent(new Event('touchstart', { bubbles: true }));
        expect(requestFn).not.toHaveBeenCalled();
    });
});
