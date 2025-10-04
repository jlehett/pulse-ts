import type { Transport } from '../domain/types';
import { WebSocketTransport } from '../infra/transports/websocket';
import { MemoryTransport } from '../infra/transports/memory';
import type { MemoryHub } from '../infra/transports/memory';
import { WebRtcMeshTransport } from '../infra/transports/webrtc';
import type { WebRtcMeshOptions } from '../infra/transports/webrtc/transport';

/**
 * Creates a WebSocket transport.
 * @param url WebSocket URL.
 * @param opts Transport options.
 * @returns A `Transport` instance backed by WebSocket.
 * @example
 * import { getNetwork, createWebSocketTransport } from '@pulse-ts/network'
 * const net = getNetwork(world)
 * await net.connect(() => createWebSocketTransport('ws://localhost:8080'))
 */
export function createWebSocketTransport(
    url: string,
    opts?: ConstructorParameters<typeof WebSocketTransport>[1],
): Transport {
    return new WebSocketTransport(url, opts);
}

/**
 * Creates an in‑memory transport for local testing.
 * @param hub Shared `MemoryHub` instance.
 * @param opts Optional peer identifier.
 * @returns A `Transport` instance backed by a local hub.
 * @example
 * import { World } from '@pulse-ts/core'
 * import { getNetwork, createMemoryHub, createMemoryTransport } from '@pulse-ts/network'
 * const hub = createMemoryHub()
 * const world = new World()
 * const net = getNetwork(world)
 * await net.connect(() => createMemoryTransport(hub, { peerId: 'a' }))
 */
export function createMemoryTransport(
    hub: MemoryHub,
    opts?: { peerId?: string },
): Transport {
    return new MemoryTransport(hub, opts?.peerId);
}

/**
 * Creates a WebRTC mesh transport. Requires an out‑of‑band signaling adapter.
 * @param selfId Stable id for this peer.
 * @param opts Mesh options including signaling and iceServers.
 * @returns A `Transport` instance backed by WebRTC DataChannels.
 * @example
 * import { WebSocketTransport } from '@pulse-ts/network/transports/websocket'
 * import { createWebRtcMeshTransport, getNetwork } from '@pulse-ts/network'
 * const signaling = () => new WebSocketTransport('ws://localhost:8080')
 * const net = getNetwork(world)
 * await net.connect(() => createWebRtcMeshTransport('peer-a', { signaling }))
 */
export function createWebRtcMeshTransport(
    selfId: string,
    opts: Omit<WebRtcMeshOptions, 'selfId'>,
): Transport {
    return new WebRtcMeshTransport({ selfId, ...opts });
}
