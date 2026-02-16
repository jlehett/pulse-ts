import { World } from '@pulse-ts/core';
import { TransportService } from './TransportService';
import { ReliableChannelService } from './ReliableChannel';
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

describe('ReliableChannelService', () => {
    it('sends a request and receives ack with result', async () => {
        const hub = createMemoryHub();
        const w1 = new World();
        const w2 = new World();
        const a = wire(w1, new MemoryTransport(hub, 'a'));
        const b = wire(w2, new MemoryTransport(hub, 'b'));
        await a.connect();
        await b.connect();

        // server-side handler on w2 (no ReliableChannelService needed)
        b.subscribe(ReservedChannels.RELIABLE, (env: any) => {
            if (!env || env.t !== 'req') return;
            const ack = {
                t: 'ack',
                id: env.id,
                status: 'ok',
                result: env.payload,
                srvSeq: 1,
            } as const;
            b.publish(ReservedChannels.RELIABLE, ack);
        });

        const rel = w1.provideService(new ReliableChannelService());
        const p = rel.send<{ v: number }, { v: number }>('echo', { v: 42 });

        // pump messages
        for (let i = 0; i < 3; i++) {
            a.flushOutgoing();
            b.dispatchIncoming();
            b.flushOutgoing();
            a.dispatchIncoming();
        }

        await expect(p).resolves.toEqual({
            status: 'ok',
            result: { v: 42 },
            reason: undefined,
            serverSeq: 1,
        });
    });
});
