// Public exports for @pulse-ts/network — client APIs favor hooks/facade.

// Types used by public API options (kept for ergonomics)
export * from './domain/types';

// Public hooks (preferred for client code)
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
// Factory helpers (function-first public API)
export {
    createWebSocketTransport,
    createMemoryTransport,
    createWebRtcMeshTransport,
} from './public/factories';

// Lightweight channel helper
export { defineChannel, channel } from './domain/messaging/channel';

// Select pure helpers that are part of public docs
export {
    shallowDelta,
    type SnapshotEnvelope,
} from './domain/replication/protocol';

// Memory hub helper for local testing (hooked via useMemory)
export { createMemoryHub, type MemoryHub } from './infra/transports/memory';

// Facade and installer
export { getNetwork } from './public/facade';

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
