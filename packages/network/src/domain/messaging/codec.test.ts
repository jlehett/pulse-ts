import { JSON_CODEC, JsonCodec } from './codec';
import type { Packet } from '../types';

describe('JsonCodec', () => {
    it('encodes and decodes packets', () => {
        const pkt: Packet = {
            channel: 'test',
            data: { a: 1, b: 'x' },
            from: 'peer-1',
        };
        const bytes = JSON_CODEC.encode(pkt);
        expect(typeof (bytes as any).byteLength).toBe('number');
        const out = JSON_CODEC.decode(bytes);
        expect(out).toEqual(pkt);
    });

    it('works with a new instance', () => {
        const codec = new JsonCodec();
        const pkt: Packet = { channel: 'x', data: 42 };
        expect(codec.decode(codec.encode(pkt))).toEqual(pkt);
    });
});
