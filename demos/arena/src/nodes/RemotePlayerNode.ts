import { useComponent, useStableId, Transform } from '@pulse-ts/core';
import { useRigidBody, useSphereCollider } from '@pulse-ts/physics';
import { useMesh } from '@pulse-ts/three';
import { useReplicateTransform } from '@pulse-ts/network';
import { PlayerTag } from '../components/PlayerTag';
import { PLAYER_RADIUS } from './LocalPlayerNode';
import { SPAWN_POSITIONS } from '../config/arena';

/** Player colors: P1 = teal, P2 = coral. */
const PLAYER_COLORS = [0x48c9b0, 0xe74c3c] as const;

export interface RemotePlayerNodeProps {
    remotePlayerId: number;
}

/**
 * Remote player node — a kinematic sphere whose transform is replicated
 * from the other world via the network layer. No local input or physics
 * simulation; position is driven entirely by incoming snapshots.
 */
export function RemotePlayerNode({
    remotePlayerId,
}: Readonly<RemotePlayerNodeProps>) {
    const spawn = SPAWN_POSITIONS[remotePlayerId];

    // Network identity — matches the producer's StableId in the other world
    useStableId(`player-${remotePlayerId}`);
    useReplicateTransform({ role: 'consumer' });

    useComponent(PlayerTag);

    const transform = useComponent(Transform);
    transform.localPosition.set(...spawn);

    // Kinematic body — position is driven by replication, not physics
    useRigidBody({ type: 'kinematic' });
    useSphereCollider(PLAYER_RADIUS, {
        friction: 0.3,
        restitution: 0.2,
    });

    // Visual — same sphere mesh as the remote player's color
    useMesh('sphere', {
        radius: PLAYER_RADIUS,
        color: PLAYER_COLORS[remotePlayerId],
        roughness: 0.4,
        metalness: 0.3,
        castShadow: true,
    });
}
