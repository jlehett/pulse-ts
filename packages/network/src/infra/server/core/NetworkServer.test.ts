import { attachWsServer } from './attachWsServer';
import { encodePacket } from '../io/packets';

type MessageHandler = (data: any, isBinary?: boolean) => void;
type CloseHandler = () => void;

function makeWs() {
    let onMessage: MessageHandler | null = null;
    let onClose: CloseHandler | null = null;
    const sent: string[] = [];
    return {
        ws: {
            on(event: 'message' | 'close' | 'error', cb: any) {
                if (event === 'message') onMessage = cb as MessageHandler;
                if (event === 'close') onClose = cb as CloseHandler;
            },
            send(data: any) {
                sent.push(typeof data === 'string' ? data : String(data));
            },
            close() {},
        },
        triggerMessage(pkt: any) {
            onMessage?.(encodePacket(pkt));
        },
        triggerClose() {
            onClose?.();
        },
        sent,
    } as const;
}

describe('NetworkServer broker integration', () => {
    it('broadcasts channel packets to peers in same room', () => {
        let connectionCb: ((ws: any, req: any) => void) | null = null;
        const wss = {
            on(event: 'connection', cb: any) {
                if (event === 'connection') connectionCb = cb;
            },
        } as const;

        attachWsServer(wss as any, { defaultRoom: 'lobby' });

        // connect A and B
        const A = makeWs();
        const B = makeWs();
        connectionCb!(A.ws, {});
        connectionCb!(B.ws, {});

        // A sends a packet on channel 'chat'
        A.triggerMessage({ channel: 'chat', data: { text: 'hi' } });

        // Expect B got a send
        expect(B.sent.length).toBe(1);
        const out = JSON.parse(B.sent[0]);
        expect(out.channel).toBe('chat');
        expect(out.data).toEqual({ text: 'hi' });
    });

    it('broadcasts __peer_leave to remaining peers when a peer disconnects', () => {
        let connectionCb: ((ws: any, req: any) => void) | null = null;
        const wss = {
            on(event: 'connection', cb: any) {
                if (event === 'connection') connectionCb = cb;
            },
        } as const;

        attachWsServer(wss as any, { defaultRoom: 'lobby' });

        const A = makeWs();
        const B = makeWs();
        connectionCb!(A.ws, {});
        connectionCb!(B.ws, {});

        // A disconnects
        A.triggerClose();

        // B should receive a __peer_leave packet
        expect(B.sent.length).toBe(1);
        const pkt = JSON.parse(B.sent[0]);
        expect(pkt.channel).toBe('__peer_leave');
        expect(typeof pkt.data).toBe('string');
    });
});
