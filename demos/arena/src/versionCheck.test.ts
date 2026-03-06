// Mock the baseUrl module (isolates import.meta.env from Jest)
jest.mock('./baseUrl', () => ({
    getBaseUrl: () => '/demos/arena/',
}));

import {
    getAppVersion,
    isUpdateAvailable,
    onUpdateAvailable,
    checkVersion,
    startVersionPolling,
    stopVersionPolling,
    resetVersionCheck,
} from './versionCheck';

const mockFetch = jest.fn() as jest.Mock;
(globalThis as any).fetch = mockFetch;

beforeEach(() => {
    jest.useFakeTimers();
    resetVersionCheck();
    mockFetch.mockReset();
});

afterEach(() => {
    jest.useRealTimers();
});

describe('getAppVersion', () => {
    it('returns the build-time version constant', () => {
        expect(getAppVersion()).toBe('test-abc');
    });
});

describe('checkVersion', () => {
    it('returns server version on success', async () => {
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ({ version: 'server-xyz' }),
        });

        const result = await checkVersion();
        expect(result).toBe('server-xyz');
    });

    it('returns null on fetch failure', async () => {
        mockFetch.mockRejectedValue(new Error('network error'));

        const result = await checkVersion();
        expect(result).toBeNull();
    });

    it('returns null on non-ok response', async () => {
        mockFetch.mockResolvedValue({ ok: false });

        const result = await checkVersion();
        expect(result).toBeNull();
    });

    it('sets updateAvailable when server version differs', async () => {
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ({ version: 'new-version' }),
        });

        expect(isUpdateAvailable()).toBe(false);
        await checkVersion();
        expect(isUpdateAvailable()).toBe(true);
    });

    it('does not set updateAvailable when versions match', async () => {
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ({ version: 'test-abc' }),
        });

        await checkVersion();
        expect(isUpdateAvailable()).toBe(false);
    });

    it('does not set updateAvailable when version is null', async () => {
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ({}),
        });

        await checkVersion();
        expect(isUpdateAvailable()).toBe(false);
    });

    it('notifies listeners on version mismatch', async () => {
        const listener = jest.fn();
        onUpdateAvailable(listener);

        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ({ version: 'new-version' }),
        });

        await checkVersion();
        expect(listener).toHaveBeenCalledTimes(1);
    });

    it('notifies listeners only once', async () => {
        const listener = jest.fn();
        onUpdateAvailable(listener);

        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ({ version: 'new-version' }),
        });

        await checkVersion();
        await checkVersion();
        expect(listener).toHaveBeenCalledTimes(1);
    });

    it('swallows listener errors', async () => {
        const badListener = jest.fn(() => {
            throw new Error('boom');
        });
        const goodListener = jest.fn();
        onUpdateAvailable(badListener);
        onUpdateAvailable(goodListener);

        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ({ version: 'new-version' }),
        });

        await checkVersion();
        expect(badListener).toHaveBeenCalled();
        expect(goodListener).toHaveBeenCalled();
    });
});

describe('onUpdateAvailable', () => {
    it('fires immediately (async) if update already detected', async () => {
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ({ version: 'new-version' }),
        });
        await checkVersion();

        const listener = jest.fn();
        onUpdateAvailable(listener);

        // Listener fires via Promise.resolve().then(), so flush microtasks
        await Promise.resolve();
        expect(listener).toHaveBeenCalledTimes(1);
    });

    it('returns an unsubscribe function', async () => {
        const listener = jest.fn();
        const unsub = onUpdateAvailable(listener);
        unsub();

        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ({ version: 'new-version' }),
        });

        await checkVersion();
        expect(listener).not.toHaveBeenCalled();
    });
});

describe('startVersionPolling / stopVersionPolling', () => {
    it('polls at the given interval', () => {
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ({ version: 'test-abc' }),
        });

        startVersionPolling(5000);

        // Initial check on start
        expect(mockFetch).toHaveBeenCalledTimes(1);

        // Advance by one interval
        jest.advanceTimersByTime(5000);
        expect(mockFetch).toHaveBeenCalledTimes(2);

        jest.advanceTimersByTime(5000);
        expect(mockFetch).toHaveBeenCalledTimes(3);

        stopVersionPolling();
    });

    it('does not start duplicate polling', () => {
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ({ version: 'test-abc' }),
        });

        startVersionPolling(5000);
        startVersionPolling(5000); // should be ignored

        expect(mockFetch).toHaveBeenCalledTimes(1); // only one initial check

        stopVersionPolling();
    });

    it('stops polling on stopVersionPolling', () => {
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ({ version: 'test-abc' }),
        });

        startVersionPolling(5000);
        stopVersionPolling();

        jest.advanceTimersByTime(10000);
        // Only the initial call, no interval calls
        expect(mockFetch).toHaveBeenCalledTimes(1);
    });
});

describe('resetVersionCheck', () => {
    it('clears update state and listeners', async () => {
        const listener = jest.fn();
        onUpdateAvailable(listener);

        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ({ version: 'new-version' }),
        });
        await checkVersion();
        expect(isUpdateAvailable()).toBe(true);
        expect(listener).toHaveBeenCalledTimes(1);

        resetVersionCheck();

        expect(isUpdateAvailable()).toBe(false);

        // Listener was cleared, so a new check should not call it again
        await checkVersion();
        expect(listener).toHaveBeenCalledTimes(1); // still 1, not 2
    });
});
