import { RateLimiter, type RateLimits } from './rateLimit';

const pkt = (channel: string, size = 10) => ({
    channel,
    data: { n: 1 },
    _size: size,
});

describe('RateLimiter', () => {
    it('limits messages per second globally', () => {
        const limits: RateLimits = { messagesPerSecond: 2, burstMultiplier: 1 };
        const rl = new RateLimiter(limits);
        const id = 'peer-1';
        expect(rl.check(id, pkt('x') as any, 10).ok).toBe(true);
        expect(rl.check(id, pkt('x') as any, 10).ok).toBe(true);
        expect(rl.check(id, pkt('x') as any, 10).ok).toBe(false);
    });

    it('limits bytes per second per channel', () => {
        const limits: RateLimits = {
            burstMultiplier: 1,
            perChannel: { x: { bytesPerSecond: 15 } },
        };
        const rl = new RateLimiter(limits);
        const id = 'peer-1';
        // first 10 bytes ok
        expect(rl.check(id, pkt('x') as any, 10).ok).toBe(true);
        // next 10 exceeds 15 capacity without time
        expect(rl.check(id, pkt('x') as any, 10).ok).toBe(false);
        // other channel unaffected
        expect(rl.check(id, pkt('y') as any, 100).ok).toBe(true);
    });
});
