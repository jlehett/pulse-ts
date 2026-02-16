import { World } from '@pulse-ts/core';
import { TransportService } from './TransportService';
import { ClockSyncService } from './ClockSyncService';
import {
    createMemoryHub,
    MemoryTransport,
} from '../../infra/transports/memory';
import { ReservedChannels } from '../messaging/reserved';

describe('ClockSyncService', () => {
    it('tracks best RTT sample and offset', async () => {
        // Stub Date.now to a controllable clock
        let now = 0;
        const realNow = Date.now;
        jest.spyOn(Date, 'now').mockImplementation(() => now);

        const hub = createMemoryHub();
        const wClient = new World();
        const tA = new TransportService();
        tA.setTransport(new MemoryTransport(hub, 'a'));
        const tB = new TransportService();
        tB.setTransport(new MemoryTransport(hub, 'b'));
        await tA.connect();
        await tB.connect();

        // Server: reply to pings with sNowMs = clientNow + offset
        const serverOffset = 100;
        tB.subscribe<any>(ReservedChannels.CLOCK, (env) => {
            if (env?.t === 'ping') {
                tB.publish(ReservedChannels.CLOCK, {
                    t: 'pong',
                    id: env.id,
                    sNowMs: now + serverOffset,
                });
            }
        });

        const clock = wClient.provideService(
            new ClockSyncService({ intervalMs: 10000 }),
        );
        // wire the client service into the client world transport service
        wClient.provideService(tA);

        // Start and trigger first ping
        now = 0;
        clock.start();
        // deliver ping to server after some time
        now = 10;
        tA.flushOutgoing();
        tB.dispatchIncoming();
        // deliver pong to client after some time
        now = 40;
        tB.flushOutgoing();
        tA.dispatchIncoming();

        // Second sample with smaller RTT
        now = 50;
        (clock as any).pingBurst?.();
        now = 52;
        tA.flushOutgoing();
        tB.dispatchIncoming();
        now = 60;
        tB.flushOutgoing();
        tA.dispatchIncoming();

        const stats = clock.getStats();
        expect(stats.bestRttMs).toBe(10);
        expect(clock.getOffsetMs()).toBe(97); // 152 - (50+60)/2

        // cleanup
        (Date.now as any) = realNow;
        clock.stop();
        await tA.disconnect();
        await tB.disconnect();
    });
});
