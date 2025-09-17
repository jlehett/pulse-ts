import type { Packet } from '../types';

/** Best-effort decode of an incoming ws message into a Packet. */
export function decodePacket(data: any): Packet | null {
    try {
        if (typeof data === 'string') return JSON.parse(data);
        if (typeof Buffer !== 'undefined' && data instanceof Buffer)
            return JSON.parse(data.toString());
        if (ArrayBuffer.isView(data))
            return JSON.parse(Buffer.from(data.buffer).toString());
    } catch {}
    return null;
}

/** Serialize a Packet to a JSON string. */
export function encodePacket(pkt: Packet): string {
    return JSON.stringify(pkt);
}
