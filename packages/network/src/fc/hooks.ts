import { useInit, useWorld, useNode, useState } from '@pulse-ts/core';
import { TransportService } from '../services/TransportService';
import type { ChannelHandler, Transport, TransportStatus } from '../types';
import { ChannelName } from '../messaging/channel';
import { NetworkTick } from '../systems/NetworkTick';
import { RpcService } from '../services/RpcService';
import { ReplicationService } from '../services/ReplicationService';
import { SnapshotSystem } from '../systems/SnapshotSystem';
import { attachComponent } from '@pulse-ts/core';
import { StableId } from '@pulse-ts/core';
import { ReliableChannelService } from '../services/ReliableChannel';
import { ClockSyncService } from '../services/ClockSyncService';
import { WebSocketTransport } from '../transports/websocket';
import { MemoryTransport } from '../transports/memory';
import type { MemoryHub } from '../transports/memory';
import { ReservedChannels } from '../messaging/reserved';

/**
 * Ensure TransportService and NetworkTick are initialized once per world.
 */
function ensureRuntime() {
    const world = useWorld();
    let svc = world.getService(TransportService);
    if (!svc) svc = world.provideService(new TransportService());
    if (!world.getSystem(NetworkTick)) world.addSystem(new NetworkTick());
    return svc;
}

/**
 * Type for the initialization function of a transport.
 */
export type TransportInit = Transport | (() => Transport);

/**
 * Use a connection to the network.
 * @param init The transport to use.
 * @returns The connection status and a function to disconnect.
 */
export function useConnection(init: TransportInit) {
    const world = useWorld();
    let svc!: TransportService;

    /**
     * Initialize the connection to the network.
     */
    useInit(() => {
        svc = ensureRuntime();
        const transport = typeof init === 'function' ? init() : init;
        svc.setTransport(transport);
        svc.connect();
        return () => {
            svc?.disconnect();
        };
    });

    return {
        /**
         * Get the connection status.
         * @returns The connection status.
         */
        getStatus: () =>
            world.getService(TransportService)?.getStatus() ?? 'idle',
        /**
         * Disconnect from the network.
         */
        disconnect: () => world.getService(TransportService)?.disconnect(),
    } as const;
}

/**
 * Convenience hook: connect via WebSocketTransport.
 * @param url WebSocket URL.
 * @param opts Transport options (protocols, ws ctor for Node, autoReconnect, backoff).
 */
export function useWebSocket(
    url: string,
    opts?: ConstructorParameters<typeof WebSocketTransport>[1],
) {
    return useConnection(() => new WebSocketTransport(url, opts));
}

/**
 * Convenience hook: connect two Worlds in-process via a MemoryHub.
 * @param hub Shared MemoryHub instance.
 * @param opts Optional peer configuration.
 */
export function useMemory(hub: MemoryHub, opts?: { peerId?: string }) {
    return useConnection(() => new MemoryTransport(hub, opts?.peerId));
}

/**
 * Use a channel to send and receive messages.
 * @param name The name of the channel.
 * @param handler The handler for the channel.
 * @returns The channel.
 */
export function useChannel<T = unknown>(
    name: ChannelName,
    handler?: ChannelHandler<T>,
) {
    const svc = ensureRuntime();
    let off: (() => void) | undefined;
    useInit(() => {
        if (handler) off = svc.subscribe<T>(name, handler);
        return () => off?.();
    });
    return {
        /**
         * Publish a message to the channel.
         * @param data The message to publish.
         */
        publish: (data: T) => svc.publish<T>(name, data),
        /**
         * Subscribe to the channel.
         * @param fn The handler for the channel.
         * @returns The channel.
         */
        subscribe: (fn: ChannelHandler<T>) => svc.subscribe<T>(name, fn),
    } as const;
}

/**
 * Use the network stats.
 * @returns The network stats.
 */
export function useNetworkStats() {
    const world = useWorld();
    const svc = ensureRuntime();
    return {
        /**
         * Get the network stats.
         * @returns The network stats.
         */
        get: () =>
            world.getService(TransportService)?.getStats() ?? svc.getStats(),
    } as const;
}

/**
 * Subscribe to transport status changes and access the latest value.
 */
export function useNetworkStatus() {
    const world = useWorld();
    const svc = ensureRuntime();
    const [getStatus, setStatus] = useState<TransportStatus>(
        'net:status',
        svc.getStatus(),
    );
    useInit(() => {
        const off = svc.onStatus.on((s) => setStatus(s));
        return () => off();
    });
    return {
        /** Latest known status (fallbacks to current service if available). */
        get: () =>
            world.getService(TransportService)?.getStatus() ?? getStatus(),
    } as const;
}

/**
 * Register or call an RPC method over the network.
 *
 * - If `handler` is provided, registers the method and returns a disposer via unmount.
 * - Always returns a `call` function to invoke the RPC.
 *
 * @param name Method name.
 * @param handler Optional method implementation.
 */
export function useRPC<Req = unknown, Res = unknown>(
    name: string,
    handler?: (payload: Req) => Res | Promise<Res>,
) {
    const world = useWorld();
    useInit(() => {
        // Ensure services are available
        let svc = world.getService(TransportService);
        if (!svc) svc = world.provideService(new TransportService());
        let rpc = world.getService(RpcService);
        if (!rpc) rpc = world.provideService(new RpcService());
        let off: (() => void) | undefined;
        if (handler) off = rpc.register<Req, Res>(name, handler);
        return () => off?.();
    });
    return {
        /** Calls the RPC method and awaits the result. */
        call: (payload: Req, opts?: { timeoutMs?: number }) => {
            let rpc = world.getService(RpcService);
            if (!rpc) rpc = world.provideService(new RpcService());
            return rpc.call<Req, Res>(name, payload, opts);
        },
    } as const;
}

/**
 * Joins a server-side room for channel routing and leaves on unmount.
 *
 * - Works with the server broker's reserved channel.
 * - Safe to call before connection; message queues until transport opens.
 */
export function useRoom(room: string) {
    const world = useWorld();
    useInit(() => {
        let svc = world.getService(TransportService);
        if (!svc) svc = world.provideService(new TransportService());
        svc.publish(ReservedChannels.ROOM, { action: 'join', room });
        return () =>
            svc.publish(ReservedChannels.ROOM, { action: 'leave', room });
    });
}

/**
 * Declares a replicated state slice for the current node.
 *
 * - Entity identity requires a StableId; ensure `useStableId('id')` was called earlier
 *   in the component, or provide `opts.id` to override.
 * - Provide `read()` to include this state in outgoing snapshots (producer role).
 * - Provide `apply(patch)` to consume incoming snapshots (consumer role).
 * - Either or both may be provided, depending on authority model.
 *
 * @param key Replica key name under the entity (e.g., 'transform', 'state').
 * @param opts Replica functions and options.
 */
export function useReplication<T = any>(
    key: string,
    opts: {
        /** Produce a JSON-serializable state object for this replica. */
        read?: () => T;
        /** Apply a shallow patch object onto local state for this replica. */
        apply?: (patch: Partial<T>) => void;
        /** Optional explicit entity id; if omitted, reads StableId.id. */
        id?: string;
    },
) {
    const world = useWorld();
    const node = useNode();
    useInit(() => {
        // Ensure services/systems are present
        let svc = world.getService(TransportService);
        if (!svc) svc = world.provideService(new TransportService());
        let rep = world.getService(ReplicationService);
        if (!rep) rep = world.provideService(new ReplicationService());
        if (!world.getSystem(NetworkTick)) world.addSystem(new NetworkTick());
        if (!world.getSystem(SnapshotSystem))
            world.addSystem(new SnapshotSystem());

        // Resolve entity id
        const id = (opts.id ?? attachComponent(node, StableId).id).trim();
        if (!id)
            throw new Error('useReplication requires StableId.id or opts.id');

        const off = rep.register(id, key, {
            read: opts.read,
            apply: opts.apply as any,
        });
        return () => off();
    });
    return {
        /** Forces this replica to be included in the next snapshot. */
        markDirty: () => {
            const rep = world.getService(ReplicationService);
            const id = (opts.id ?? attachComponent(node, StableId).id).trim();
            if (rep && id) rep.markDirty(id, key);
        },
    } as const;
}

/**
 * Access a reliable request/ack channel by topic.
 *
 * - Returns a stable `send` that resolves with a generic `{ status, result, reason }`.
 */
export function useReliable<TReq = any, TRes = any>(topic: string) {
    const world = useWorld();
    useInit(() => {
        if (!world.getService(ReliableChannelService))
            world.provideService(new ReliableChannelService());
    });
    return {
        send: (
            payload: TReq,
            opts?: { timeoutMs?: number; retries?: number },
        ) => {
            let svc = world.getService(ReliableChannelService);
            if (!svc) svc = world.provideService(new ReliableChannelService());
            return svc.send<TReq, TRes>(topic, payload, opts);
        },
    } as const;
}

/**
 * Starts client clock sync and provides accessors for server time.
 */
export function useClockSync(opts?: { intervalMs?: number; burst?: number }) {
    const world = useWorld();
    let svc: ClockSyncService | undefined;
    useInit(() => {
        svc = world.getService(ClockSyncService);
        if (!svc) svc = world.provideService(new ClockSyncService(opts));
        svc.start();
        return () => svc?.stop();
    });
    return {
        getOffsetMs: () =>
            world.getService(ClockSyncService)?.getOffsetMs() ?? 0,
        getServerNowMs: () =>
            world.getService(ClockSyncService)?.getServerNowMs() ?? Date.now(),
        getStats: () =>
            world.getService(ClockSyncService)?.getStats() ?? {
                samples: 0,
                bestRttMs: 0,
                offsetMs: 0,
            },
    } as const;
}
