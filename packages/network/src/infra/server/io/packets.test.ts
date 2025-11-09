import { decodePacket, encodePacket } from './packets';

describe('packets encode/decode', () => {
    it('roundtrips JSON string', () => {
        const pkt = { channel: 'x', data: { v: 1 } };
        const s = encodePacket(pkt as any);
        expect(typeof s).toBe('string');
        const out = decodePacket(s);
        expect(out).toEqual(pkt);
    });

    it('decodes Buffer and ArrayBufferView', () => {
        const pkt = { channel: 'y', data: { ok: true } };
        const s = JSON.stringify(pkt);
        const buf = Buffer.from(s);
        expect(decodePacket(buf)).toEqual(pkt);
        const view = new Uint8Array(buf);
        expect(decodePacket(view)).toEqual(pkt);
    });
});
