import type { World } from '@pulse-ts/core';
import type { Codec, Transport } from '../domain/types';
import { TransportService } from '../domain/services/TransportService';
import { RpcService } from '../domain/services/RpcService';
import { ReplicationService } from '../domain/services/ReplicationService';
import { InterpolationService } from '../domain/services/InterpolationService';
import { NetworkTick } from '../domain/systems/NetworkTick';
import { SnapshotSystem } from '../domain/systems/SnapshotSystem';
import { InterpolationSystem } from '../domain/systems/InterpolationSystem';

/** Options for installing @pulse-ts/network into a World. */
export interface NetworkInstallOptions {
    /** Optional transport instance or factory; if provided, it is set on TransportService. */
    transport?: Transport | (() => Transport);
    /** Auto-connect the transport when provided. Default: true. */
    autoConnect?: boolean;
    /** Optional packet codec for TransportService. */
    codec?: Codec;
    /** Replication configuration. */
    replication?: { channel?: string; sendHz?: number };
    /** Enable/disable systems. All enabled by default. */
    systems?: {
        networkTick?: boolean;
        snapshot?: boolean;
        interpolation?: boolean;
    };
}

/** Return shape of installNetwork. */
export interface InstalledNetwork {
    transport: TransportService;
    rpc: RpcService;
    replication: ReplicationService;
    interpolation: InterpolationService;
}

/**
 * Installs @pulse-ts/network services and systems into a World.
 *
 * - Idempotent: re-uses existing services/systems if present.
 * - Optionally sets a transport (and connects) and configures replication.
 *
 * @param world The World to install into.
 * @param opts Optional installation options.
 * @returns The installed service instances.
 *
 * @example
 * import { World } from '@pulse-ts/core'
 * import { installNetwork, createWebSocketTransport } from '@pulse-ts/network'
 * const world = new World()
 * await installNetwork(world, {
 *   transport: () => createWebSocketTransport('ws://localhost:8080'),
 *   replication: { sendHz: 20 },
 * })
 */
export async function installNetwork(
    world: World,
    opts: NetworkInstallOptions = {},
): Promise<InstalledNetwork> {
    // Services
    let transport = world.getService(TransportService);
    if (!transport)
        transport = world.provideService(
            new TransportService({ codec: opts.codec }),
        );
    else if (opts.codec) transport.setCodec(opts.codec);

    let rpc = world.getService(RpcService);
    if (!rpc) rpc = world.provideService(new RpcService());

    let replication = world.getService(ReplicationService);
    if (!replication)
        replication = world.provideService(
            new ReplicationService(opts.replication),
        );
    else if (opts.replication) replication.configure(opts.replication);

    let interpolation = world.getService(InterpolationService);
    if (!interpolation)
        interpolation = world.provideService(new InterpolationService());

    // Systems
    const sys = opts.systems ?? {};
    if (sys.networkTick !== false && !world.getSystem(NetworkTick))
        world.addSystem(new NetworkTick());
    if (sys.snapshot !== false && !world.getSystem(SnapshotSystem))
        world.addSystem(new SnapshotSystem());
    if (sys.interpolation !== false && !world.getSystem(InterpolationSystem))
        world.addSystem(new InterpolationSystem());

    // Transport setup
    if (opts.transport) {
        const t =
            typeof opts.transport === 'function'
                ? opts.transport()
                : opts.transport;
        transport.setTransport(t);
        if (opts.autoConnect !== false) await transport.connect();
    }

    return { transport, rpc, replication, interpolation };
}
