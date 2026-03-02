import {
    useComponent,
    useStableId,
    useContext,
    useFixedUpdate,
    useFrameUpdate,
    Transform,
} from '@pulse-ts/core';
import { useRigidBody, useSphereCollider } from '@pulse-ts/physics';
import { useMesh } from '@pulse-ts/three';
import { useParticleBurst } from '@pulse-ts/effects';
import { useReplicateTransform } from '@pulse-ts/network';
import { PlayerTag } from '../components/PlayerTag';
import { GameCtx } from '../contexts';
import { PLAYER_RADIUS } from './LocalPlayerNode';
import {
    SPAWN_POSITIONS,
    DEATH_PLANE_Y,
    PLAYER_COLORS,
    TRAIL_VELOCITY_THRESHOLD,
    TRAIL_BASE_INTERVAL,
} from '../config/arena';
import { stagePlayerPosition, getReplayPosition } from '../replay';

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
    const { root } = useMesh('sphere', {
        radius: PLAYER_RADIUS,
        color: PLAYER_COLORS[remotePlayerId],
        emissive: PLAYER_COLORS[remotePlayerId],
        emissiveIntensity: 0.15,
        roughness: 0.35,
        metalness: 0.4,
        castShadow: true,
    });

    // Velocity-proportional trail burst — emitted when moving fast
    const trailBurst = useParticleBurst({
        count: 3,
        lifetime: 0.5,
        color: PLAYER_COLORS[remotePlayerId],
        speed: [0.2, 0.6],
        gravity: 1,
        size: 0.2,
        blending: 'additive',
        shrink: true,
    });
    let trailAccum = 0;
    let prevTrailX = spawn[0];
    let prevTrailZ = spawn[2];

    // Stage position for replay recording every fixed step, and drive
    // transform from replay buffer during playback so trsSync picks it up.
    useFixedUpdate(() => {
        stagePlayerPosition(
            remotePlayerId,
            transform.localPosition.x,
            transform.localPosition.y,
            transform.localPosition.z,
        );

        if (gameState.phase === 'replay') {
            const replayPos = getReplayPosition(remotePlayerId);
            if (replayPos) {
                transform.localPosition.set(
                    replayPos[0],
                    replayPos[1],
                    replayPos[2],
                );
            }
        }
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

    // During replay, override mesh position from the replay buffer.
    // Also emit velocity-proportional trail particles during gameplay.
    useFrameUpdate((dt) => {
        const replayPos = getReplayPosition(remotePlayerId);
        if (replayPos) {
            root.position.set(replayPos[0], replayPos[1], replayPos[2]);
        }

        // Velocity-proportional trail particles during gameplay
        if (gameState.phase === 'playing' && dt > 0) {
            const cx = root.position.x;
            const cz = root.position.z;
            const vx = (cx - prevTrailX) / dt;
            const vz = (cz - prevTrailZ) / dt;
            const vmag = Math.sqrt(vx * vx + vz * vz);
            if (vmag > TRAIL_VELOCITY_THRESHOLD) {
                trailAccum += dt;
                const interval = Math.max(
                    0.01,
                    TRAIL_BASE_INTERVAL / (vmag / TRAIL_VELOCITY_THRESHOLD),
                );
                if (trailAccum >= interval) {
                    trailAccum = 0;
                    trailBurst([cx, root.position.y, cz]);
                }
            } else {
                trailAccum = 0;
            }
            prevTrailX = cx;
            prevTrailZ = cz;
        } else {
            trailAccum = 0;
        }
    });
}
