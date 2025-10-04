import { handleRoomMessage, type RoomAck } from './rooms';
import { ReservedChannels } from '../../domain/messaging/reserved';

function mkMgr() {
    const rooms = new Map<string, Set<string>>();
    return {
        joinRoom(peerId: string, room: string) {
            const set =
                rooms.get(room) ??
                (rooms.set(room, new Set()), rooms.get(room)!);
            set.add(peerId);
            return { ok: true } as const;
        },
        leaveRoom(peerId: string, room: string) {
            const set = rooms.get(room);
            if (!set || !set.has(peerId))
                return { ok: false, reason: 'not_member' as const };
            set.delete(peerId);
            return { ok: true } as const;
        },
    };
}

describe('rooms', () => {
    it('sends ack for join/leave', () => {
        const mgr = mkMgr();
        const acks: RoomAck[] = [];
        const unicast = (_id: string, pkt: any) => {
            if (pkt.channel === ReservedChannels.ROOM) acks.push(pkt.data);
        };
        handleRoomMessage(
            mgr,
            'p1',
            { action: 'join', room: 'lobby' },
            unicast,
        );
        handleRoomMessage(
            mgr,
            'p1',
            { action: 'leave', room: 'lobby' },
            unicast,
        );
        expect(acks).toEqual([
            { t: 'ack', action: 'join', room: 'lobby' },
            { t: 'ack', action: 'leave', room: 'lobby' },
        ]);
    });

    it('errors on bad requests', () => {
        const mgr = mkMgr();
        const acks: RoomAck[] = [];
        handleRoomMessage(mgr as any, 'p', { bad: true }, (_id, pkt) =>
            acks.push(pkt.data),
        );
        expect(acks[0].t).toBe('err');
    });
});
