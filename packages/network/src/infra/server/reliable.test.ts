import { handleReliableRequest, type RelReqEnv } from './reliable';

describe('handleReliableRequest', () => {
    it('dedupes by id and increments per-peer sequence', async () => {
        const handlers = new Map<string, (p: any, peer: { id: string }) => any>();
        let called = 0;
        handlers.set('echo', (p) => {
            called++;
            return p;
        });
        const seenByPeer = new Map<string, Map<string, any>>();
        const seqByPeer = new Map<string, number>();

        const sent: any[] = [];
        const unicast = (_peerId: string, pkt: any) => sent.push(pkt);

        const peer = { id: 'peer-1' };
        const req1: RelReqEnv = { t: 'req', id: 'id-1', topic: 'echo', payload: { v: 1 } };
        const req2: RelReqEnv = { t: 'req', id: 'id-2', topic: 'echo', payload: { v: 2 } };

        handleReliableRequest(handlers as any, peer, req1, unicast as any, seenByPeer as any, seqByPeer as any);
        handleReliableRequest(handlers as any, peer, req2, unicast as any, seenByPeer as any, seqByPeer as any);
        // allow async handler pipeline to run (macro-task boundary)
        await new Promise((r) => setTimeout(r, 0));

        expect(sent).toHaveLength(2);
        const ack1 = sent[0].data;
        const ack2 = sent[1].data;
        expect(ack1.t).toBe('ack');
        expect(ack2.t).toBe('ack');
        expect(ack1.srvSeq).toBe(1);
        expect(ack2.srvSeq).toBe(2);
        expect(called).toBe(2);

        // duplicate id should return cached ack and not call handler again
        const before = called;
        handleReliableRequest(handlers as any, peer, req1, unicast as any, seenByPeer as any, seqByPeer as any);
        await new Promise((r) => setTimeout(r, 0));
        expect(called).toBe(before);
        const dup = sent[sent.length - 1].data;
        expect(dup.id).toBe('id-1');
        expect(dup.srvSeq).toBe(1);
    });
});
