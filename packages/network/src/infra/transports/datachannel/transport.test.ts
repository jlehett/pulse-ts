/**
 * Tests for the DataChannelTransport.
 *
 * Verifies that a single RTCDataChannel is correctly wrapped as a
 * Transport, with proper status transitions, message dispatch, and cleanup.
 */

// ---------------------------------------------------------------------------
// Mocks for RTCDataChannel and RTCPeerConnection
// ---------------------------------------------------------------------------

function createMockDataChannel(
    initialState: RTCDataChannelState = 'open',
): RTCDataChannel {
    return {
        readyState: initialState,
        binaryType: 'arraybuffer',
        onmessage: null,
        onopen: null,
        onclose: null,
        onerror: null,
        send: jest.fn(),
        close: jest.fn(),
    } as unknown as RTCDataChannel;
}

function createMockPeerConnection(): RTCPeerConnection {
    return {
        connectionState: 'connected',
        onconnectionstatechange: null,
        close: jest.fn(),
    } as unknown as RTCPeerConnection;
}

import { DataChannelTransport } from './transport';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('DataChannelTransport', () => {
    let dc: RTCDataChannel;
    let pc: RTCPeerConnection;

    beforeEach(() => {
        dc = createMockDataChannel();
        pc = createMockPeerConnection();
    });

    it('starts in idle status', () => {
        const t = new DataChannelTransport(dc, pc);
        expect(t.getStatus()).toBe('idle');
    });

    it('transitions to open when DataChannel is already open', async () => {
        const t = new DataChannelTransport(dc, pc, 'opponent');
        const statusSpy = jest.fn();
        t.onStatus(statusSpy);

        await t.connect();

        expect(t.getStatus()).toBe('open');
        expect(statusSpy).toHaveBeenCalledWith('connecting');
        expect(statusSpy).toHaveBeenCalledWith('open');
    });

    it('waits for DataChannel to open if still connecting', async () => {
        dc = createMockDataChannel('connecting');
        const t = new DataChannelTransport(dc, pc, 'opponent');

        await t.connect();
        expect(t.getStatus()).toBe('connecting');

        // Simulate DataChannel open
        (dc as any).readyState = 'open';
        dc.onopen!({} as Event);

        expect(t.getStatus()).toBe('open');
    });

    it('fires peerJoin when DataChannel opens', async () => {
        const t = new DataChannelTransport(dc, pc, 'opponent');
        const joinSpy = jest.fn();
        t.onPeerJoin!(joinSpy);

        await t.connect();

        expect(joinSpy).toHaveBeenCalledWith('opponent');
    });

    it('fires peerLeave when DataChannel closes', async () => {
        const t = new DataChannelTransport(dc, pc, 'opponent');
        const leaveSpy = jest.fn();
        t.onPeerLeave!(leaveSpy);

        await t.connect();
        dc.onclose!({} as Event);

        expect(leaveSpy).toHaveBeenCalledWith('opponent');
        expect(t.getStatus()).toBe('closed');
    });

    it('receives and dispatches ArrayBuffer messages', async () => {
        const t = new DataChannelTransport(dc, pc, 'opponent');
        const msgSpy = jest.fn();
        t.onMessage(msgSpy);

        await t.connect();

        const buf = new Uint8Array([1, 2, 3]).buffer;
        dc.onmessage!({ data: buf } as MessageEvent);

        expect(msgSpy).toHaveBeenCalledTimes(1);
        const [data, meta] = msgSpy.mock.calls[0];
        expect(data).toEqual(new Uint8Array([1, 2, 3]));
        expect(meta).toEqual({ from: 'opponent' });
    });

    it('receives and dispatches string messages', async () => {
        const t = new DataChannelTransport(dc, pc, 'opponent');
        const msgSpy = jest.fn();
        t.onMessage(msgSpy);

        await t.connect();

        dc.onmessage!({ data: 'hello' } as MessageEvent);

        expect(msgSpy).toHaveBeenCalledTimes(1);
        const [data] = msgSpy.mock.calls[0];
        expect(new TextDecoder().decode(data)).toBe('hello');
    });

    it('sends binary data over the DataChannel', async () => {
        const t = new DataChannelTransport(dc, pc);
        await t.connect();

        const payload = new Uint8Array([10, 20, 30]);
        t.send(payload);

        expect(dc.send).toHaveBeenCalledTimes(1);
    });

    it('does not send when DataChannel is not open', async () => {
        dc = createMockDataChannel('connecting');
        const t = new DataChannelTransport(dc, pc);
        await t.connect();

        t.send(new Uint8Array([1]));

        expect(dc.send).not.toHaveBeenCalled();
    });

    it('disconnect closes both DataChannel and PeerConnection', async () => {
        const t = new DataChannelTransport(dc, pc);
        await t.connect();
        await t.disconnect();

        expect(dc.close).toHaveBeenCalled();
        expect(pc.close).toHaveBeenCalled();
        expect(t.getStatus()).toBe('closed');
    });

    it('unsubscribe removes handlers', async () => {
        const t = new DataChannelTransport(dc, pc, 'peer');
        const spy = jest.fn();
        const unsub = t.onMessage(spy);

        await t.connect();
        unsub();

        dc.onmessage!({ data: new ArrayBuffer(1) } as MessageEvent);
        expect(spy).not.toHaveBeenCalled();
    });

    it('reports peers() correctly', async () => {
        const t = new DataChannelTransport(dc, pc, 'opponent');
        expect(t.peers!()).toEqual(['opponent']);

        dc = createMockDataChannel('connecting');
        const t2 = new DataChannelTransport(dc, pc, 'opponent');
        expect(t2.peers!()).toEqual([]);
    });

    it('defaults peerId to "peer"', async () => {
        const t = new DataChannelTransport(dc, pc);
        const joinSpy = jest.fn();
        t.onPeerJoin!(joinSpy);

        await t.connect();
        expect(joinSpy).toHaveBeenCalledWith('peer');
    });

    it('handles PeerConnection state changes', async () => {
        const t = new DataChannelTransport(dc, pc, 'opponent');
        const leaveSpy = jest.fn();
        t.onPeerLeave!(leaveSpy);

        await t.connect();

        // Simulate PeerConnection failure
        (pc as any).connectionState = 'failed';
        pc.onconnectionstatechange!({} as Event);

        expect(t.getStatus()).toBe('closed');
        expect(leaveSpy).toHaveBeenCalledWith('opponent');
    });
});
