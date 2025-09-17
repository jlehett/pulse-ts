import type { Packet } from '../types';
import { ReservedChannels } from '../messaging/reserved';

export type RoomAction = 'join' | 'leave';

export type RoomControl = { action: RoomAction; room: string };

export type RoomAck =
    | { t: 'ack'; action: RoomAction; room: string }
    | { t: 'err'; action: RoomAction; room: string; reason: RoomErrorReason };

export type RoomErrorReason =
    | 'bad_request'
    | 'max_rooms'
    | 'not_member'
    | 'unknown_room'
    | 'unknown_peer';

export interface RoomManagerLike {
    joinRoom(
        peerId: string,
        room: string,
    ): { ok: true } | { ok: false; reason: RoomErrorReason };
    leaveRoom(
        peerId: string,
        room: string,
    ): { ok: true } | { ok: false; reason: RoomErrorReason };
}

/** Handles a __room control message and responds with an ack/error. */
export function handleRoomMessage(
    mgr: RoomManagerLike,
    peerId: string,
    msg: any,
    unicast: (peerId: string, packet: Packet) => void,
) {
    const action: RoomAction | undefined = msg?.action;
    const room: string | undefined = msg?.room;
    if (
        (action !== 'join' && action !== 'leave') ||
        !room ||
        typeof room !== 'string'
    ) {
        const ack: RoomAck = {
            t: 'err',
            action: (action as any) ?? 'join',
            room: String(room ?? ''),
            reason: 'bad_request',
        };
        unicast(peerId, { channel: ReservedChannels.ROOM, data: ack });
        return true;
    }
    if (action === 'join') {
        const res = mgr.joinRoom(peerId, room);
        const ack: RoomAck = res.ok
            ? { t: 'ack', action: 'join', room }
            : { t: 'err', action: 'join', room, reason: res.reason };
        unicast(peerId, { channel: ReservedChannels.ROOM, data: ack });
        return true;
    }
    if (action === 'leave') {
        const res = mgr.leaveRoom(peerId, room);
        const ack: RoomAck = res.ok
            ? { t: 'ack', action: 'leave', room }
            : { t: 'err', action: 'leave', room, reason: res.reason };
        unicast(peerId, { channel: ReservedChannels.ROOM, data: ack });
        return true;
    }
    return false;
}
