import { World } from '@pulse-ts/core';
import { TransportService } from './TransportService';
import { ReplicationService } from './ReplicationService';
import {
    createMemoryHub,
    MemoryTransport,
} from '../../infra/transports/memory';

function wire(world: World, t: MemoryTransport) {
    const net = world.provideService(new TransportService());
    net.setTransport(t);
    return net;
}

describe('ReplicationService', () => {
    it('builds delta snapshot and applies on receiver', async () => {
        const hub = createMemoryHub();
        const w1 = new World();
        const w2 = new World();
        const a = wire(w1, new MemoryTransport(hub, 'a'));
        const b = wire(w2, new MemoryTransport(hub, 'b'));
        await a.connect();
        await b.connect();

        const rep1 = w1.provideService(new ReplicationService());
        const rep2 = w2.provideService(new ReplicationService());

        let applied: any = null;
        rep2.register('E1', 'state', { apply: (patch) => (applied = patch) });
        rep1.register('E1', 'state', { read: () => ({ x: 1 }) });

        rep1.sendSnapshot();
        a.flushOutgoing();
        b.dispatchIncoming();

        expect(applied).toEqual({ x: 1 });
    });
});
