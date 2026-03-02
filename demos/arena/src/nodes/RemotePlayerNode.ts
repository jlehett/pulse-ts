import {
    useComponent,
    useStableId,
    useContext,
    useFixedUpdate,
    Transform,
} from '@pulse-ts/core';
import { useRigidBody, useSphereCollider } from '@pulse-ts/physics';
import { useMesh } from '@pulse-ts/three';
import { useReplicateTransform } from '@pulse-ts/network';
import { PlayerTag } from '../components/PlayerTag';
import { GameCtx } from '../contexts';
import { PLAYER_RADIUS } from './LocalPlayerNode';
import { SPAWN_POSITIONS, DEATH_PLANE_Y } from '../config/arena';

/** Player colors: P1 = teal, P2 = coral. */
const PLAYER_COLORS = [0x48c9b0, 0xe74c3c] as const;

export interface RemotePlayerNodeProps {
    remotePlayerId: number;
    /** When true, skip the death-plane check — knockouts are received
     *  via the knockout channel from the dying machine instead. */
    online?: boolean;
}

/**
 * Remote player node — a kinematic sphere whose transform is replicated
 * from the other world via the network layer. No local input or physics
 * simulation; position is driven entirely by incoming snapshots.
 */
export function RemotePlayerNode({
    remotePlayerId,
    online,
}: Readonly<RemotePlayerNodeProps>) {
    const gameState = useContext(GameCtx);
    const spawn = SPAWN_POSITIONS[remotePlayerId];

    // Network identity — matches the producer's StableId in the other world
    useStableId(`player-${remotePlayerId}`);
    // Higher lambda = snappier tracking. Default 12 is too sluggish for a
    // fast-paced arena — remote players visually lag behind their true position,
    // making collisions appear to trigger at a distance ("forcefield" effect).
    useReplicateTransform({ role: 'consumer', lambda: 25 });

    useComponent(PlayerTag);

    const transform = useComponent(Transform);
    transform.localPosition.set(...spawn);

    // Kinematic body — position is driven by replication, not physics
    useRigidBody({ type: 'kinematic' });
    useSphereCollider(PLAYER_RADIUS, {
        friction: 0.3,
        restitution: 0.2,
    });

    // Visual — same sphere mesh with subtle emissive glow (blooms under post-processing)
    useMesh('sphere', {
        radius: PLAYER_RADIUS,
        color: PLAYER_COLORS[remotePlayerId],
        emissive: PLAYER_COLORS[remotePlayerId],
        emissiveIntensity: 0.15,
        roughness: 0.35,
        metalness: 0.4,
        castShadow: true,
    });

    // Detect when the remote player falls off the arena (replicated position).
    // In online mode, replicated position lags — knockouts arrive via the
    // knockout channel from the dying machine, so skip this check.
    if (!online) {
        useFixedUpdate(() => {
            if (gameState.phase !== 'playing' || gameState.paused) return;
            if (transform.localPosition.y < DEATH_PLANE_Y) {
                gameState.pendingKnockout = remotePlayerId;
            }
        });
    }
}
