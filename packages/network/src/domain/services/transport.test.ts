import { TransportService } from './TransportService';
import {
    createMemoryHub,
    MemoryTransport,
} from '../../infra/transports/memory';

describe('TransportService', () => {
    it('publishes/subscribes via underlying transport', async () => {
        const hub = createMemoryHub();
        const aT = new MemoryTransport(hub, 'a');
        const bT = new MemoryTransport(hub, 'b');

        const a = new TransportService({ selfId: 'a' });
        const b = new TransportService({ selfId: 'b' });
        a.setTransport(aT);
        b.setTransport(bT);
        await a.connect();
        await b.connect();

        const received: any[] = [];
        const off = b.subscribe<{ text: string }>('chat', (msg, meta) => {
            received.push({ msg, meta });
        });

        // events and stats tracking
        let out = 0;
        let inn = 0;
        a.onPacketOut.on(() => out++);
        b.onPacketIn.on(() => inn++);

        a.publish('chat', { text: 'hello' });
        a.flushOutgoing();
        b.dispatchIncoming();

        expect(received).toEqual([
            { msg: { text: 'hello' }, meta: { from: 'a' } },
        ]);
        expect(out).toBe(1);
        expect(inn).toBe(1);
        expect(a.getStats().packetsOut).toBe(1);
        expect(b.getStats().packetsIn).toBe(1);

        off();
        await a.disconnect();
        await b.disconnect();
    });

    it('filters addressed packets based on selfId', async () => {
        const hub = createMemoryHub();
        const aT = new MemoryTransport(hub, 'a');
        const bT = new MemoryTransport(hub, 'b');
        const cT = new MemoryTransport(hub, 'c');

        const a = new TransportService({ selfId: 'a' });
        const b = new TransportService({ selfId: 'b' });
        const c = new TransportService({ selfId: 'c' });
        a.setTransport(aT);
        b.setTransport(bT);
        c.setTransport(cT);
        await a.connect();
        await b.connect();
        await c.connect();

        const gotB: string[] = [];
        const gotC: string[] = [];
        b.subscribe<string>('dm', (m) => gotB.push(m));
        c.subscribe<string>('dm', (m) => gotC.push(m));

        a.publishTo('dm', 'b', 'to-b');
        a.flushOutgoing();
        b.dispatchIncoming();
        c.dispatchIncoming();

        expect(gotB).toEqual(['to-b']);
        expect(gotC).toEqual([]);
    });

    it('channel().once receives only first message', async () => {
        const hub = createMemoryHub();
        const aT = new MemoryTransport(hub, 'a');
        const bT = new MemoryTransport(hub, 'b');

        const a = new TransportService({ selfId: 'a' });
        const b = new TransportService({ selfId: 'b' });
        a.setTransport(aT);
        b.setTransport(bT);
        await a.connect();
        await b.connect();

        const got: string[] = [];
        b.channel<string>('topic').once((m) => got.push(m));
        a.channel<string>('topic').publish('first');
        a.channel<string>('topic').publish('second');
        a.flushOutgoing();
        b.dispatchIncoming();
        expect(got).toEqual(['first']);
    });

    it('drops addressed packets when receiver has no selfId set', async () => {
        const hub = createMemoryHub();
        const aT = new MemoryTransport(hub, 'a');
        const bT = new MemoryTransport(hub, 'b');

        const a = new TransportService({ selfId: 'a' });
        const b = new TransportService(); // no selfId configured
        a.setTransport(aT);
        b.setTransport(bT);
        await a.connect();
        await b.connect();

        const gotB: string[] = [];
        b.subscribe<string>('dm', (m) => gotB.push(m));

        a.publishTo('dm', 'b', 'to-b');
        a.pump();
        b.pump();

        expect(gotB).toEqual([]);
    });

    it('pump() flushes and dispatches in one call', async () => {
        const hub = createMemoryHub();
        const aT = new MemoryTransport(hub, 'a');
        const bT = new MemoryTransport(hub, 'b');

        const a = new TransportService({ selfId: 'a' });
        const b = new TransportService({ selfId: 'b' });
        a.setTransport(aT);
        b.setTransport(bT);
        await a.connect();
        await b.connect();

        const got: string[] = [];
        b.subscribe<string>('chat', (m) => got.push(m));

        a.publish('chat', 'hello');
        a.pump();
        b.pump();

        expect(got).toEqual(['hello']);
    });
});
