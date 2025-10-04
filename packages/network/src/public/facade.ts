import type { World } from '@pulse-ts/core';
import { TransportService } from '../domain/services/TransportService';
import { RpcService } from '../domain/services/RpcService';
import { ReplicationService } from '../domain/services/ReplicationService';
import { ReliableChannelService } from '../domain/services/ReliableChannel';
import { NetworkTick } from '../domain/systems/NetworkTick';
import { SnapshotSystem } from '../domain/systems/SnapshotSystem';
import type { ChannelHandler, Transport, Unsubscribe } from '../domain/types';
import type { ChannelName } from '../domain/messaging/channel';
import { channelKey } from '../domain/messaging/channel';

/**
 * Simplified facade over common networking tasks for a given World.
 *
 * Prefer using hooks in components; this facade is handy in imperative code.
 *
 * @example
 * import { World } from '@pulse-ts/core'
 * import { getNetwork } from '@pulse-ts/network'
 * // Optionally provide a transport factory (e.g., a deep import of WebSocketTransport)
 * const world = new World()
 * const net = getNetwork(world)
 * await net.connect(() => undefined as any)
 * net.channel<string>('chat').publish('hello')
 */
export function getNetwork(world: World) {
    function ensureTransportService() {
        let svc = world.getService(TransportService);
        if (!svc) svc = world.provideService(new TransportService());
        return svc;
    }

    function ensureRpcService() {
        let svc = world.getService(RpcService);
        if (!svc) svc = world.provideService(new RpcService());
        return svc;
    }

    function ensureReplicationService() {
        let svc = world.getService(ReplicationService);
        if (!svc) svc = world.provideService(new ReplicationService());
        return svc;
    }

    function ensureReliableService() {
        let svc = world.getService(ReliableChannelService);
        if (!svc) svc = world.provideService(new ReliableChannelService());
        return svc;
    }

    function ensureSystems() {
        if (!world.getSystem(NetworkTick)) world.addSystem(new NetworkTick());
        if (!world.getSystem(SnapshotSystem))
            world.addSystem(new SnapshotSystem());
    }

    return {
        /** Sets the low-level transport and optionally connects (default true). */
        async connect(
            t: Transport | (() => Transport),
            opts?: { autoConnect?: boolean },
        ) {
            ensureSystems();
            const svc = ensureTransportService();
            const transport = typeof t === 'function' ? t() : t;
            svc.setTransport(transport);
            if (opts?.autoConnect !== false) await svc.connect();
        },
        /** Current connection status. */
        status(): ReturnType<TransportService['getStatus']> {
            return world.getService(TransportService)?.getStatus() ?? 'idle';
        },
        /** Disconnects if connected. */
        async disconnect() {
            await world.getService(TransportService)?.disconnect();
        },
        /** Basic transport statistics. */
        stats() {
            const svc = ensureTransportService();
            return svc.getStats();
        },
        /**
         * Typed channel helper.
         */
        channel<T = unknown>(name: ChannelName) {
            const key = channelKey(name);
            const svc = ensureTransportService();
            return {
                publish(data: T) {
                    svc.publish<T>(key, data);
                },
                subscribe(fn: ChannelHandler<T>): Unsubscribe {
                    return svc.subscribe<T>(key, fn);
                },
            } as const;
        },
        /**
         * RPC helper for a given method name.
         */
        rpc<Req = unknown, Res = unknown>(name: string) {
            return {
                register(
                    fn: (payload: Req) => Res | Promise<Res>,
                ): Unsubscribe {
                    const rpc = ensureRpcService();
                    return rpc.register<Req, Res>(name, fn);
                },
                call(payload: Req, opts?: { timeoutMs?: number }) {
                    const rpc = ensureRpcService();
                    return rpc.call<Req, Res>(name, payload, opts);
                },
            } as const;
        },
        /**
         * Reliable request/ack channel by topic.
         */
        reliable<TReq = unknown, TRes = unknown>(topic: string) {
            return {
                send(
                    payload: TReq,
                    opts?: { timeoutMs?: number; retries?: number },
                ) {
                    const rel = ensureReliableService();
                    return rel.send<TReq, TRes>(topic, payload, opts);
                },
            } as const;
        },
        /**
         * Registers a replica under an explicit entity id.
         * Returns helpers to dirty or dispose the registration.
         */
        replicate<T = any>(
            key: string,
            opts: {
                id: string;
                read?: () => T;
                apply?: (patch: Partial<T>) => void;
            },
        ) {
            ensureSystems();
            const rep = ensureReplicationService();
            const off = rep.register(opts.id, key, {
                read: opts.read,
                apply: opts.apply as any,
            });
            return {
                markDirty() {
                    rep.markDirty(opts.id, key);
                },
                dispose() {
                    off();
                },
            } as const;
        },
    } as const;
}
