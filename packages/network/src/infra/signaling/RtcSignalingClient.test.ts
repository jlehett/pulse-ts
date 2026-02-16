import { TransportService } from '../../domain/services/TransportService';
import {
    createMemoryHub,
    MemoryTransport,
} from '../../infra/transports/memory';
import { ReservedChannels } from '../../domain/messaging/reserved';
import { RtcSignalingClient } from './RtcSignalingClient';

describe('RtcSignalingClient', () => {
    it('filters by recipient and sets from on send', async () => {
        const hub = createMemoryHub();
        const tA = new TransportService({ selfId: 'a' });
        tA.setTransport(new MemoryTransport(hub, 'a'));
        const tB = new TransportService({ selfId: 'b' });
        tB.setTransport(new MemoryTransport(hub, 'b'));
        await tA.connect();
        await tB.connect();

        const signal = new RtcSignalingClient(tA, 'a');
        const received: any[] = [];
        signal.start((env) => received.push(env));

        // B sends a message addressed to A → delivered
        tB.publish(ReservedChannels.SIGNAL, {
            to: 'a',
            type: 'hello',
            payload: { n: 1 },
        });
        tB.flushOutgoing();
        tA.dispatchIncoming();
        expect(received.length).toBe(1);
        expect(received[0].to).toBe('a');

        // B sends a message addressed to C → ignored
        tB.publish(ReservedChannels.SIGNAL, {
            to: 'c',
            type: 'hello',
            payload: { n: 2 },
        });
        tB.flushOutgoing();
        tA.dispatchIncoming();
        expect(received.length).toBe(1);

        // A uses client.send to B → B should receive with from='a'
        const gotAtB: any[] = [];
        tB.subscribe(ReservedChannels.SIGNAL, (env: any) => gotAtB.push(env));
        signal.send('b', 'hello', { z: 1 });
        tA.flushOutgoing();
        tB.dispatchIncoming();
        expect(gotAtB[0].from).toBe('a');

        signal.stop();
        await tA.disconnect();
        await tB.disconnect();
    });
});
