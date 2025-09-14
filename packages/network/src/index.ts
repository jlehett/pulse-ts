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
// Transports (WebRTC)
export {
    WebRtcMeshTransport,
    type WebRtcMeshOptions,
} from './transports/webrtc';

// Utilities
export { defineChannel, channel } from './messaging/channel';
export { shallowDelta, type SnapshotEnvelope } from './replication/protocol';
// Services
export { RpcService } from './services/RpcService';
export { getNetwork } from './facade';
export {
    RtcSignalingClient,
    type SignalEnvelope,
} from './signaling/RtcSignalingClient';

// Installer
export {
    installNetwork,
    type NetworkInstallOptions,
    type InstalledNetwork,
} from './install';

// Server utilities (Node)
export { NetworkServer } from './server/broker';
export { attachWsServer } from './server/ws';
// Server helpers
export { type RateLimits } from './server/rateLimit';
export {
    type RoomAction,
    type RoomControl,
    type RoomAck,
    type RoomErrorReason,
} from './server/rooms';
export { validateWithZod, type ZodLikeSchema } from './server/validate';
