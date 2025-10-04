// Public exports for @pulse-ts/network (refactored layout)

export * from './domain/types';

// Services
export { TransportService } from './domain/services/TransportService';
export { ReplicationService } from './domain/services/ReplicationService';
export { InterpolationService } from './domain/services/InterpolationService';
export {
    ReliableChannelService,
    type ReliableResult,
} from './domain/services/ReliableChannel';
export { ClockSyncService } from './domain/services/ClockSyncService';

// Systems
export { NetworkTick } from './domain/systems/NetworkTick';
export { SnapshotSystem } from './domain/systems/SnapshotSystem';
export { InterpolationSystem } from './domain/systems/InterpolationSystem';

// Public hooks
export {
    useConnection,
    useWebSocket,
    useWebRTC,
    useMemory,
    useChannel,
    useChannelTo,
    useNetworkStats,
    useNetworkStatus,
    usePeers,
    useRPC,
    useRPCTo,
    useReplication,
    useRoom,
    useReliable,
    useReliableTo,
    useClockSync,
} from './public/hooks';
export { useReplicateTransform } from './public/transform';

// Transports
export {
    MemoryTransport,
    createMemoryHub,
    type MemoryHub,
} from './infra/transports/memory';
export { WebSocketTransport } from './infra/transports/websocket';
export {
    WebRtcMeshTransport,
    type WebRtcMeshOptions,
} from './infra/transports/webrtc';

// Utilities
export { defineChannel, channel } from './domain/messaging/channel';
export {
    shallowDelta,
    type SnapshotEnvelope,
} from './domain/replication/protocol';
// Services
export { RpcService } from './domain/services/RpcService';
export { getNetwork } from './public/facade';
export {
    RtcSignalingClient,
    type SignalEnvelope,
} from './infra/signaling/RtcSignalingClient';

// Installer
export {
    installNetwork,
    type NetworkInstallOptions,
    type InstalledNetwork,
} from './public/install';

// Server utilities (Node)
export { NetworkServer } from './infra/server/broker';
export { attachWsServer } from './infra/server/ws';
// Server helpers
export { type RateLimits } from './infra/server/rateLimit';
export {
    type RoomAction,
    type RoomControl,
    type RoomAck,
    type RoomErrorReason,
} from './infra/server/rooms';
export { validateWithZod, type ZodLikeSchema } from './infra/server/validate';
