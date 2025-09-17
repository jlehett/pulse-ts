export type PeerConn = {
    send(data: string | ArrayBufferView | ArrayBufferLike): void;
    close(code?: number, reason?: string): void;
};

export type Peer = { id: string; ws: PeerConn; rooms: Set<string> };

export class PeerManager {
    private peers = new Map<string, Peer>();
    private rooms = new Map<string, Set<string>>();

    addPeer(id: string, ws: PeerConn): Peer {
        const p: Peer = { id, ws, rooms: new Set() };
        this.peers.set(id, p);
        return p;
    }

    removePeer(id: string) {
        const p = this.peers.get(id);
        if (!p) return;
        for (const r of p.rooms) this.leaveRoom(id, r);
        this.peers.delete(id);
    }

    joinRoom(
        peerId: string,
        room: string,
        opts?: { maxRoomsPerPeer?: number },
    ): { ok: true } | { ok: false; reason: 'max_rooms' | 'unknown_peer' } {
        const p = this.peers.get(peerId);
        if (!p) return { ok: false, reason: 'unknown_peer' };
        if (opts?.maxRoomsPerPeer && p.rooms.size >= opts.maxRoomsPerPeer)
            return { ok: false, reason: 'max_rooms' };
        p.rooms.add(room);
        (
            this.rooms.get(room) ?? this.rooms.set(room, new Set()).get(room)!
        ).add(peerId);
        return { ok: true };
    }

    leaveRoom(
        peerId: string,
        room: string,
    ): { ok: true } | { ok: false; reason: 'unknown_room' | 'not_member' } {
        const p = this.peers.get(peerId);
        if (!p) return { ok: false, reason: 'unknown_room' };
        if (!p.rooms.has(room)) return { ok: false, reason: 'not_member' };
        p.rooms.delete(room);
        const set = this.rooms.get(room);
        set?.delete(peerId);
        if (set && set.size === 0) this.rooms.delete(room);
        return { ok: true };
    }

    peersInRoom(room: string): string[] {
        return [...(this.rooms.get(room) ?? [])];
    }

    roomsForPeer(peerId: string): string[] {
        const p = this.peers.get(peerId);
        return p ? [...p.rooms] : [];
    }

    listRooms(): string[] {
        return [...this.rooms.keys()];
    }

    listPeers(): string[] {
        return [...this.peers.keys()];
    }

    getPeer(id: string): Peer | undefined {
        return this.peers.get(id);
    }
}
