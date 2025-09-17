import type { Packet } from '../types';
import { ReservedChannels } from '../messaging/reserved';

export type RelReqEnv = { t: 'req'; id: string; topic: string; payload: any };
export type RelAckEnv = {
    t: 'ack';
    id: string;
    status: 'ok' | 'error';
    result?: any;
    reason?: string;
    srvSeq: number;
};

export type RelHandler = (
    payload: any,
    peer: { id: string },
) => any | Promise<any>;

/** Processes a reliable request, handles dedupe/seq, and unicasts an ack. */
export function handleReliableRequest(
    handlers: Map<string, RelHandler>,
    peer: { id: string },
    env: RelReqEnv,
    unicast: (peerId: string, packet: Packet) => void,
    seenByPeer: Map<string, Map<string, RelAckEnv>>, // peerId -> id -> ack
    seqByPeer: Map<string, number>, // peerId -> last seq
) {
    if (!env || env.t !== 'req' || typeof env.id !== 'string') return;
    const topic = env.topic;
    const per =
        seenByPeer.get(peer.id) ??
        (seenByPeer.set(peer.id, new Map()), seenByPeer.get(peer.id)!);
    // dedupe by id
    if (per.has(env.id)) {
        const ack = per.get(env.id)!;
        unicast(peer.id, { channel: ReservedChannels.RELIABLE, data: ack });
        return;
    }
    const srvSeq = (seqByPeer.get(peer.id) ?? 0) + 1;
    seqByPeer.set(peer.id, srvSeq);
    const fn = handlers.get(topic);
    if (!fn) {
        const ack: RelAckEnv = {
            t: 'ack',
            id: env.id,
            status: 'error',
            reason: 'unknown_topic',
            srvSeq,
        };
        per.set(env.id, ack);
        unicast(peer.id, { channel: ReservedChannels.RELIABLE, data: ack });
        trim(per);
        return;
    }
    Promise.resolve()
        .then(() => fn(env.payload, peer))
        .then((result) => {
            const ack: RelAckEnv = {
                t: 'ack',
                id: env.id,
                status: 'ok',
                result,
                srvSeq,
            };
            per.set(env.id, ack);
            unicast(peer.id, { channel: ReservedChannels.RELIABLE, data: ack });
            trim(per);
        })
        .catch((e) => {
            const ack: RelAckEnv = {
                t: 'ack',
                id: env.id,
                status: 'error',
                reason: e?.message ?? String(e),
                srvSeq,
            };
            per.set(env.id, ack);
            unicast(peer.id, { channel: ReservedChannels.RELIABLE, data: ack });
            trim(per);
        });
}

function trim(per: Map<string, RelAckEnv>) {
    const MAX = 1000;
    if (per.size <= MAX) return;
    const it = per.keys();
    const first = it.next();
    if (!first.done) per.delete(first.value);
}
