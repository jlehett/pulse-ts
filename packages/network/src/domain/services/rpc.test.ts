import { World } from '@pulse-ts/core';
import { RpcService } from './RpcService';
import { TransportService } from './TransportService';
import {
    createMemoryHub,
    MemoryTransport,
} from '../../infra/transports/memory';

function wire(world: World, t: MemoryTransport) {
    const net = world.provideService(new TransportService());
    net.setTransport(t);
    return net;
}

describe('RpcService', () => {
    it('calls and responds across worlds', async () => {
        const hub = createMemoryHub();
        const w1 = new World();
        const w2 = new World();
        const a = wire(w1, new MemoryTransport(hub, 'a'));
        const b = wire(w2, new MemoryTransport(hub, 'b'));
        await a.connect();
        await b.connect();

        // Simulate server-side handler by subscribing directly on transport
        b.subscribe('__rpc', (env: any) => {
            if (!env || env.t !== 'req') return;
            b.publish('__rpc', { t: 'res', id: env.id, r: env.p.x + env.p.y });
        });

        const rpc1 = w1.provideService(new RpcService());
        const p = rpc1.call('add', { x: 2, y: 3 });

        // pump messages both ways (simulate NetworkTick)
        for (let i = 0; i < 3; i++) {
            a.flushOutgoing();
            b.dispatchIncoming();
            b.flushOutgoing();
            a.dispatchIncoming();
        }

        await expect(p).resolves.toBe(5);
    });
});
