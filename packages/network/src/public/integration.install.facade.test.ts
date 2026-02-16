import { World } from '@pulse-ts/core';
import { installNetwork } from './install';
import { getNetwork } from './facade';
import { createMemoryHub, MemoryTransport } from '../infra/transports/memory';
import { ReservedChannels } from '../domain/messaging/reserved';

// Allow a bit more time for integration pumps on CI
jest.setTimeout(10000);

function pump(a: any, b: any, steps = 3) {
    for (let i = 0; i < steps; i++) {
        a.flushOutgoing();
        b.dispatchIncoming();
        b.flushOutgoing();
        a.dispatchIncoming();
    }
}

describe('installNetwork + facade integration', () => {
    it('subscribes and publishes via facade.channel across two worlds', async () => {
        const hub = createMemoryHub();
        const w1 = new World();
        const w2 = new World();

        const { transport: t1 } = await installNetwork(w1, {
            transport: () => new MemoryTransport(hub, 'a'),
            autoConnect: true,
        });
        const { transport: t2 } = await installNetwork(w2, {
            transport: () => new MemoryTransport(hub, 'b'),
            autoConnect: true,
        });

        const net2 = getNetwork(w2);
        const got: string[] = [];
        net2.channel<string>('chat').subscribe((m) => got.push(m));

        const net1 = getNetwork(w1);
        net1.channel<string>('chat').publish('hello');

        pump(t1, t2);

        expect(got).toEqual(['hello']);
    });

    it('RPC via facade works end-to-end', async () => {
        const hub = createMemoryHub();
        const w1 = new World();
        const w2 = new World();

        const { transport: t1 } = await installNetwork(w1, {
            transport: () => new MemoryTransport(hub, 'a'),
            autoConnect: true,
        });
        const { transport: t2 } = await installNetwork(w2, {
            transport: () => new MemoryTransport(hub, 'b'),
            autoConnect: true,
        });

        // Use facade to register and call
        const net2 = getNetwork(w2);
        const net1 = getNetwork(w1);

        // Ensure addressed responses are supported (optional; broadcast also works)
        t1.setSelfId('a');
        t2.setSelfId('b');

        const off = net2
            .rpc<{ x: number; y: number }, number>('add')
            .register(({ x, y }) => x + y);

        const p = net1
            .rpc<{ x: number; y: number }, number>('add')
            .call({ x: 2, y: 3 });

        // Drive the transports until resolved or we give up
        let val: any = undefined;
        let err: any = undefined;
        p.then((v) => (val = v)).catch((e) => (err = e));
        for (let i = 0; i < 50 && val === undefined && err === undefined; i++) {
            pump(t1, t2);
            // yield to flush microtasks

            await Promise.resolve();
        }
        off();
        expect(err).toBeUndefined();
        expect(val).toBe(5);
    });

    it('Reliable via facade works end-to-end', async () => {
        const hub = createMemoryHub();
        const w1 = new World();
        const w2 = new World();

        const { transport: t1 } = await installNetwork(w1, {
            transport: () => new MemoryTransport(hub, 'a'),
            autoConnect: true,
        });
        const { transport: t2 } = await installNetwork(w2, {
            transport: () => new MemoryTransport(hub, 'b'),
            autoConnect: true,
        });

        // Server-side handler: echo back payload via RELIABLE ack
        const net2 = getNetwork(w2);
        // Subscribe to reserved channel using raw channel helper
        const offRel = net2
            .channel<any>(ReservedChannels.RELIABLE)
            .subscribe((env: any) => {
                if (!env || env.t !== 'req') return;
                net2.channel<any>(ReservedChannels.RELIABLE).publish({
                    t: 'ack',
                    id: env.id,
                    status: 'ok',
                    result: env.payload,
                    srvSeq: 1,
                });
            });

        // Client: send via facade reliable(topic)
        const net1 = getNetwork(w1);
        const p = net1.reliable<{ msg: string }, { msg: string }>('echo').send({
            msg: 'hi',
        });

        // Wait for resolution while pumping
        let val: any = undefined;
        let err: any = undefined;
        p.then((v) => (val = v)).catch((e) => (err = e));
        for (let i = 0; i < 50 && val === undefined && err === undefined; i++) {
            pump(t1, t2);

            await Promise.resolve();
        }
        offRel();
        expect(err).toBeUndefined();
        expect(val).toEqual({
            status: 'ok',
            result: { msg: 'hi' },
            reason: undefined,
            serverSeq: 1,
        });
    });
});
