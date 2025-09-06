// Public exports for @pulse-ts/network (M1 scope)

export * from './types';

// Services
export { TransportService } from './services/TransportService';
export { ReplicationService } from './services/ReplicationService';
export { InterpolationService } from './services/InterpolationService';
export {
    ReliableChannelService,
    type ReliableResult,
} from './services/ReliableChannel';
export { ClockSyncService } from './services/ClockSyncService';

// Systems
export { NetworkTick } from './systems/NetworkTick';
export { SnapshotSystem } from './systems/SnapshotSystem';
export { InterpolationSystem } from './systems/InterpolationSystem';

// FC Hooks
export {
    useConnection,
    useChannel,
    useNetworkStats,
    useRPC,
    useReplication,
    useRoom,
    useReliable,
    useClockSync,
} from './fc/hooks';
export { useReplicateTransform } from './fc/transform';

// Transports (Memory)
export {
    MemoryTransport,
    createMemoryHub,
    type MemoryHub,
} from './transports/memory';

// Transports (WebSocket)
export { WebSocketTransport } from './transports/websocket';

// Utilities
export { defineChannel } from './messaging/channel';
export { shallowDelta, type SnapshotEnvelope } from './replication/protocol';
// Services
export { RpcService } from './services/RpcService';

// Installer
export {
    installNetwork,
    type NetworkInstallOptions,
    type InstalledNetwork,
} from './install';

// Server utilities (Node)
export { NetworkServer, attachWsServer } from './server/broker';
export {
    createPresenceHttpHandler,
    type PresenceHttpOptions,
} from './server/presence';
