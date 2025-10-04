import { channelKey, defineChannel, once } from './channel';

describe('channel helpers', () => {
    it('defineChannel creates a typed name and channelKey resolves it', () => {
        const ch = defineChannel<{ msg: string }>('my:ch');
        expect(ch.name).toBe('my:ch');
        expect(channelKey(ch)).toBe('my:ch');
        expect(channelKey('raw:string')).toBe('raw:string');
    });

    it('once wraps a handler to run only once', () => {
        const events: number[] = [];
        const fn = once<number>((v) => events.push(v));
        fn(1, {});
        fn(2, {});
        expect(events).toEqual([1]);
    });
});
