import { Codec, Packet } from '../types';

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

/**
 * JSON codec for messages.
 */
export class JsonCodec implements Codec {
    /**
     * Encode a packet.
     * @param packet The packet.
     * @returns The encoded packet.
     */
    encode(packet: Packet): Uint8Array {
        return textEncoder.encode(JSON.stringify(packet));
    }

    /**
     * Decode a packet.
     * @param bytes The encoded packet.
     * @returns The decoded packet.
     */
    decode(bytes: Uint8Array): Packet {
        const s = textDecoder.decode(bytes);
        return JSON.parse(s);
    }
}

/**
 * JSON codec for messages.
 */
export const JSON_CODEC = new JsonCodec();
