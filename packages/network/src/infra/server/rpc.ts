import type { Packet } from '../../domain/types';

export type RpcEnvelope =
    | { t: 'req'; id: string; m: string; p: any }
    | { t: 'res'; id: string; r?: any; e?: { message?: string } };

export type RpcHandler = (
    payload: any,
    peer: { id: string },
) => any | Promise<any>;

/** Handles an incoming RPC request envelope; returns true if consumed. */
export function handleRpcMessage(
    rpc: Map<string, RpcHandler>,
    env: RpcEnvelope,
    peer: { id: string },
    unicast: (peerId: string, packet: Packet) => void,
) {
    if (!env || (env as any).t !== 'req' || !('m' in env)) return false;
    const fn = rpc.get(env.m);
    if (!fn) return true; // consume unknowns silently
    Promise.resolve()
        .then(() => fn(env.p, peer))
        .then((r) =>
            unicast(peer.id, {
                channel: '__rpc',
                data: { t: 'res', id: env.id, r } as RpcEnvelope,
            }),
        )
        .catch((e) =>
            unicast(peer.id, {
                channel: '__rpc',
                data: {
                    t: 'res',
                    id: env.id,
                    e: { message: e?.message ?? String(e) },
                } as RpcEnvelope,
            }),
        );
    return true;
}
