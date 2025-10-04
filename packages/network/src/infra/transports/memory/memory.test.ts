import { createMemoryHub, MemoryTransport } from '.';

function u8(s: string) {
    return new TextEncoder().encode(s);
}

function s8(b: Uint8Array) {
    return new TextDecoder().decode(b);
}

describe('MemoryTransport', () => {
    it('connects to a hub and exchanges messages', async () => {
        const hub = createMemoryHub();
        const a = new MemoryTransport(hub, 'a');
        const b = new MemoryTransport(hub, 'b');

        const recv: string[] = [];
        b.onMessage((d, meta) => {
            recv.push(`${meta?.from}:${s8(d)}`);
        });

        await a.connect();
        await b.connect();
        a.send(u8('hello'));

        expect(recv).toEqual(['a:hello']);

        await a.disconnect();
        await b.disconnect();
    });
});
