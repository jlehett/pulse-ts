import { WebSocketTransport } from './transport';

class FakeWS {
    static instances: FakeWS[] = [];
    public binaryType: 'arraybuffer' | 'blob' = 'arraybuffer';
    public onopen: ((ev: any) => any) | null = null;
    public onclose: ((ev: any) => any) | null = null;
    public onerror: ((ev: any) => any) | null = null;
    public onmessage: ((ev: { data: any }) => any) | null = null;
    public sent: any[] = [];
    constructor(
        public url: string,
        public protocols?: string | string[],
    ) {
        FakeWS.instances.push(this);
    }
    send(data: any) {
        this.sent.push(data);
    }
    close() {
        this.onclose?.({});
    }
}

function u8(s: string) {
    return new TextEncoder().encode(s);
}

describe('WebSocketTransport', () => {
    beforeEach(() => {
        FakeWS.instances = [];
    });

    it('connects, normalizes messages, sends and disconnects', async () => {
        const t = new WebSocketTransport('ws://x', { ws: FakeWS as any });
        const statuses: string[] = [];
        t.onStatus((s) => statuses.push(s));
        const recvd: string[] = [];
        t.onMessage((d) => recvd.push(new TextDecoder().decode(d)));

        const p = t.connect();
        // trigger open immediately
        FakeWS.instances[0].onopen?.({});
        await p;
        expect(t.getStatus()).toBe('open');

        // send bytes
        t.send(u8('hello'));
        expect(FakeWS.instances[0].sent.length).toBe(1);

        // receive string
        FakeWS.instances[0].onmessage?.({ data: 'hi' });
        // receive an ArrayBufferView (Uint8Array)
        const view = u8('yo');
        FakeWS.instances[0].onmessage?.({ data: view });

        expect(recvd).toEqual(['hi', 'yo']);

        await t.disconnect();
        expect(t.getStatus()).toBe('closed');
        expect(statuses.includes('open')).toBe(true);
        expect(statuses.includes('closed')).toBe(true);
    });

    it('autoReconnect schedules a reconnect on close', async () => {
        jest.useFakeTimers();
        const t = new WebSocketTransport('ws://x', {
            ws: FakeWS as any,
            autoReconnect: true,
            backoff: { initialMs: 10, maxMs: 20, factor: 2 },
        });
        await t.connect();
        FakeWS.instances[0].onopen?.({});
        // simulate close → schedule reconnect
        FakeWS.instances[0].onclose?.({});
        // advance timers enough to trigger reconnect
        jest.advanceTimersByTime(25);
        expect(FakeWS.instances.length).toBeGreaterThanOrEqual(2);
        jest.useRealTimers();
    });
});
