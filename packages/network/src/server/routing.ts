import type { Packet } from '../types';
import type { ChannelRegistry } from './channels';

/**
 * Runs channel registry hooks (validate/onMessage/route) and forwards if not consumed.
 */
export function handleRegisteredChannel(
    channels: ChannelRegistry,
    packet: Packet,
    peer: { id: string; rooms: Set<string> },
    forward: (
        packet: Packet,
        rooms: Iterable<string> | undefined,
        exceptId: string,
    ) => void,
    server: any,
) {
    const reg = channels.get(packet.channel);
    if (reg?.validate && !safeTrue(() => reg.validate!(packet.data, peer)))
        return;
    if (reg?.onMessage) {
        const consumed = safeTrue(() =>
            reg.onMessage!(packet.data, peer, server),
        );
        if (consumed) return;
    }
    const routeRooms =
        reg?.route?.(packet.data, peer) ??
        (peer.rooms.size ? peer.rooms : undefined);
    forward(packet, routeRooms, peer.id);
}

function safeTrue(fn: () => any) {
    try {
        return !!fn();
    } catch {
        return false;
    }
}
