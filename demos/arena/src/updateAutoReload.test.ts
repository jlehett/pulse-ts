import { createAutoReloader, RELOAD_DELAY } from './updateAutoReload';

beforeEach(() => {
    jest.useFakeTimers();
});

afterEach(() => {
    jest.useRealTimers();
});

describe('createAutoReloader', () => {
    it('calls reloadFn after RELOAD_DELAY', () => {
        const reload = jest.fn();
        const reloader = createAutoReloader(reload);

        reloader.schedule();
        expect(reload).not.toHaveBeenCalled();

        jest.advanceTimersByTime(RELOAD_DELAY);
        expect(reload).toHaveBeenCalledTimes(1);
    });

    it('does not fire if cancelled before delay', () => {
        const reload = jest.fn();
        const reloader = createAutoReloader(reload);

        reloader.schedule();
        jest.advanceTimersByTime(RELOAD_DELAY / 2);
        reloader.cancel();

        jest.advanceTimersByTime(RELOAD_DELAY);
        expect(reload).not.toHaveBeenCalled();
    });

    it('allows re-scheduling after cancel', () => {
        const reload = jest.fn();
        const reloader = createAutoReloader(reload);

        reloader.schedule();
        reloader.cancel();
        reloader.schedule();

        jest.advanceTimersByTime(RELOAD_DELAY);
        expect(reload).toHaveBeenCalledTimes(1);
    });

    it('ignores duplicate schedule calls', () => {
        const reload = jest.fn();
        const reloader = createAutoReloader(reload);

        reloader.schedule();
        reloader.schedule(); // should be ignored

        jest.advanceTimersByTime(RELOAD_DELAY);
        expect(reload).toHaveBeenCalledTimes(1);
    });

    it('cancel is safe to call when nothing is scheduled', () => {
        const reload = jest.fn();
        const reloader = createAutoReloader(reload);

        expect(() => reloader.cancel()).not.toThrow();
    });

    it('dispose prevents future scheduling', () => {
        const reload = jest.fn();
        const reloader = createAutoReloader(reload);

        reloader.dispose();
        reloader.schedule();

        jest.advanceTimersByTime(RELOAD_DELAY * 2);
        expect(reload).not.toHaveBeenCalled();
    });

    it('dispose cancels a pending reload', () => {
        const reload = jest.fn();
        const reloader = createAutoReloader(reload);

        reloader.schedule();
        reloader.dispose();

        jest.advanceTimersByTime(RELOAD_DELAY);
        expect(reload).not.toHaveBeenCalled();
    });
});
