import { PeerManager } from './peers';

const ws = () => ({ send: () => {}, close: () => {} });

describe('PeerManager', () => {
    it('adds/removes peers and manages rooms', () => {
        const mgr = new PeerManager();
        mgr.addPeer('a', ws());
        mgr.addPeer('b', ws());
        expect(mgr.listPeers().sort()).toEqual(['a', 'b']);
        expect(mgr.joinRoom('a', 'lobby')).toEqual({ ok: true });
        expect(mgr.joinRoom('a', 'dev', { maxRoomsPerPeer: 1 })).toEqual({
            ok: false,
            reason: 'max_rooms',
        });
        expect(mgr.peersInRoom('lobby')).toEqual(['a']);
        expect(mgr.roomsForPeer('a')).toEqual(['lobby']);
        expect(mgr.leaveRoom('a', 'lobby')).toEqual({ ok: true });
        expect(mgr.roomsForPeer('a')).toEqual([]);
    });
});
