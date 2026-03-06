import {
    useComponent,
    useStableId,
    useContext,
    useFixedUpdate,
    useFrameUpdate,
    useWorld,
    Transform,
} from '@pulse-ts/core';
import { useRigidBody, useSphereCollider } from '@pulse-ts/physics';
import { useMesh } from '@pulse-ts/three';
import { useParticleBurst } from '@pulse-ts/effects';
import { useReplicateTransform, InterpolationService } from '@pulse-ts/network';
import { PlayerTag } from '../components/PlayerTag';
import { GameCtx } from '../contexts';
import { PLAYER_RADIUS } from './LocalPlayerNode';
import {
    SPAWN_POSITIONS,
    DEATH_PLANE_Y,
    PLAYER_COLORS,
    TRAIL_VELOCITY_REFERENCE,
    TRAIL_BASE_INTERVAL,
} from '../config/arena';
import { stagePlayerPosition, getReplayPosition } from '../replay';
import { setPlayerVelocity } from '../playerVelocity';

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

    const world = useWorld();

    // Network identity — matches the producer's StableId in the other world
    const stableId = `player-${remotePlayerId}`;
    useStableId(stableId);
    // Higher lambda = snappier tracking. Default 12 is too sluggish for a
    // fast-paced arena — remote players visually lag behind their true position,
    // making collisions appear to trigger at a distance ("forcefield" effect).
    useReplicateTransform({ role: 'consumer', lambda: 25 });

    useComponent(PlayerTag);

    const transform = useComponent(Transform);
    transform.localPosition.set(...spawn);

    // Kinematic body — position is driven by replication, not physics.
    // Restitution set to 0 to minimize the physics bounce on the local
    // dynamic body (kinematic gets invMass=0, so 100% of the collision
    // response hits the local player). The knockback system handles all
    // intentional impulses; the solver only provides position correction.
    useRigidBody({ type: 'kinematic' });
    useSphereCollider(PLAYER_RADIUS, {
        friction: 0,
        restitution: 0,
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
        count: 8,
        lifetime: 1.0,
        color: PLAYER_COLORS[remotePlayerId],
        speed: [0.2, 0.8],
        gravity: 1,
        size: 0.4,
        blending: 'additive',
        shrink: true,
    });
    let trailAccum = 0;
    let prevTrailX = spawn[0];
    let prevTrailZ = spawn[2];

    // Track round number to detect round resets — snap to spawn immediately
    // so the remote player doesn't linger at their post-knockout position
    // while waiting for replicated position updates from the other machine.
    let lastRound = gameState.round;

    // Stage position for replay recording every fixed step, and drive
    // transform from replay buffer during playback so trsSync picks it up.
    // Use the replicated velocity from the InterpolationService (source-
    // authoritative, sent by the producer in each snapshot) rather than
    // deriving it from interpolated position deltas, which lag during
    // sudden speed changes (dashes).
    useFixedUpdate(() => {
        // Round reset — snap to spawn so the remote player doesn't linger
        // at their post-knockout position during ko_flash/countdown.
        if (gameState.round !== lastRound) {
            lastRound = gameState.round;
            transform.localPosition.set(...spawn);
            root.visible = true;
        }

        stagePlayerPosition(
            remotePlayerId,
            transform.localPosition.x,
            transform.localPosition.y,
            transform.localPosition.z,
        );

        // Read replicated velocity from the interpolation target — this is
        // the source-authoritative velocity sent by the producer, not derived
        // from smoothed position deltas.
        const interp = world.getService(InterpolationService);
        const rv = interp?.getTargetVelocity(stableId);
        if (rv) {
            setPlayerVelocity(remotePlayerId, rv.x, rv.z);
        }

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
            if (gameState.phase !== 'playing') return;
            if (transform.localPosition.y < DEATH_PLANE_Y) {
                gameState.pendingKnockout = remotePlayerId;
            }
        });
    }

    // During replay, override transform.localPosition from the replay buffer
    // AFTER InterpolationSystem (order 100) runs, so the network-smoothed
    // position doesn't fight with the replay position. trsSync (late phase)
    // then copies our replay position to root.position.
    useFrameUpdate(
        () => {
            if (gameState.phase !== 'replay') return;
            const replayPos = getReplayPosition(remotePlayerId);
            if (replayPos) {
                transform.localPosition.set(
                    replayPos[0],
                    replayPos[1],
                    replayPos[2],
                );
            }
        },
        { order: 200 },
    );

    // Emit velocity-proportional trail particles during gameplay.
    useFrameUpdate((dt) => {
        // Velocity-proportional trail particles during gameplay
        if (gameState.phase === 'playing' && dt > 0) {
            const cx = root.position.x;
            const cz = root.position.z;
            const vx = (cx - prevTrailX) / dt;
            const vz = (cz - prevTrailZ) / dt;
            const vmag = Math.sqrt(vx * vx + vz * vz);
            if (vmag > 0.1) {
                trailAccum += dt;
                const interval = Math.max(
                    0.01,
                    TRAIL_BASE_INTERVAL / (vmag / TRAIL_VELOCITY_REFERENCE),
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
