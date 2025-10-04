import { World } from '@pulse-ts/core';
import { ClockSyncService } from './ClockSyncService';
import { TransportService } from './TransportService';
import {
    createMemoryHub,
    MemoryTransport,
} from '../../infra/transports/memory';
import { ReservedChannels } from '../messaging/reserved';

function wire(world: World, t: MemoryTransport) {
    const net = world.provideService(new TransportService());
    net.setTransport(t);
    return net;
}

describe('ClockSyncService', () => {
    it('collects samples and updates stats via ping/pong', async () => {
        const hub = createMemoryHub();
        const w1 = new World();
        const w2 = new World();
        const a = wire(w1, new MemoryTransport(hub, 'a'));
        const b = wire(w2, new MemoryTransport(hub, 'b'));
        await a.connect();
        await b.connect();

        // server-like responder on B
        b.subscribe(ReservedChannels.CLOCK, (env: any) => {
            if (!env || env.t !== 'ping') return;
            b.publish(ReservedChannels.CLOCK, {
                t: 'pong',
                id: env.id,
                sNowMs: Date.now(),
            });
        });

        const svc = w1.provideService(
            new ClockSyncService({ intervalMs: 1000 }),
        );
        svc.start();

        // Drive a few cycles
        for (let i = 0; i < 5; i++) {
            a.flushOutgoing();
            b.dispatchIncoming();
            b.flushOutgoing();
            a.dispatchIncoming();
            // let microtasks run

            await Promise.resolve();
        }

        const stats = svc.getStats();
        expect(stats.samples).toBeGreaterThanOrEqual(1);
        expect(typeof svc.getOffsetMs()).toBe('number');
        expect(stats.bestRttMs).toBeGreaterThanOrEqual(0);

        svc.stop();
    });
});
