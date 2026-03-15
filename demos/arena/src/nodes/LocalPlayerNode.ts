import {
    useComponent,
    useFixedUpdate,
    useFrameUpdate,
    useContext,
    useStableId,
    useStore,
    Transform,
} from '@pulse-ts/core';
import { useAxis2D, useAction } from '@pulse-ts/input';
import { useRigidBody, useSphereCollider } from '@pulse-ts/physics';
import {
    useMesh,
    useThreeContext,
    useInterpolatedPosition,
} from '@pulse-ts/three';
import { useSound, useSoundGroup } from '@pulse-ts/audio';
import { useParticleBurst } from '@pulse-ts/effects';
import { useReplicateTransform, useChannel } from '@pulse-ts/network';
import { PlayerTag } from '../components/PlayerTag';
import { GameCtx } from '../contexts';
import {
    SPAWN_POSITIONS,
    DEATH_PLANE_Y,
    PLAYER_COLORS,
} from '../config/arena';
import { KnockoutChannel } from '../config/channels';
import { TRAIL_BURST_CONFIG, IMPACT_BURST_CONFIG } from '../config/particles';
import { IMPACT_SOUND_CONFIG } from '../config/sounds';
import { ReplayStore, stagePlayerPosition, getReplayPosition } from '../replay';
import { useShockwavePool, worldToScreen } from '../shockwave';
import { useHitImpactPool } from '../hitImpact';
import { setPlayerPosition } from '../ai/playerPositions';
import { DashCooldownStore } from '../dashCooldown';
import { PlayerVelocityStore, updatePlayerVelocity } from '../playerVelocity';

// Extracted modules
import { useDash, tryActivateDash, DASH_SPEED, DASH_COOLDOWN } from './dash';
import { useIndicatorRing } from './indicatorRing';
import { useKnockback, KNOCKOUT_BURST_COUNT } from './knockback';
import type { KnockbackDeps } from './knockback';
import { createTrailEmitter } from './trailEmitter';

// Re-export pure functions and constants so existing imports continue to work.
export {
    computeKnockback,
    computeApproachSpeed,
    computeDashDirection,
} from './mechanics';
export { DASH_SPEED, DASH_DURATION, DASH_COOLDOWN } from './dash';
export {
    KNOCKBACK_BASE,
    KNOCKBACK_VELOCITY_SCALE,
    IMPACT_COOLDOWN,
    KNOCKOUT_BURST_COUNT,
} from './knockback';
export {
    INDICATOR_RING_COLOR,
    INDICATOR_RING_SCALE,
    INDICATOR_RING_BORDER,
} from './indicatorRing';

/** Sphere radius for the player ball. */
export const PLAYER_RADIUS = 0.8;

/** Impulse applied per fixed tick when movement input is held. */
export const MOVE_IMPULSE = 0.6;

/** Linear damping — lower values mean longer coasting and harder to control. */
export const LINEAR_DAMPING = 0.25;

export interface LocalPlayerNodeProps {
    /** Player index (0 or 1). */
    playerId: number;
    /** Input action name for the 2D movement axis (e.g. 'p1Move'). */
    moveAction: string;
    /** Input action name for the dash button (e.g. 'p1Dash'). */
    dashAction: string;
    /** Enable network replication as producer (online mode). */
    replicate?: boolean;
    /** Show the "you" indicator ring even when not replicating (e.g. solo mode). */
    showIndicatorRing?: boolean;
    /** Override the default player color (hex, e.g. `0xff0000`). */
    customColor?: number;
}

/**
 * Local player node — a dynamic sphere with movement and a dash mechanic.
 * Each instance controls one player, reading from its own namespaced
 * input actions so both players coexist in a single world.
 */
export function LocalPlayerNode({
    playerId,
    moveAction,
    dashAction,
    replicate,
    showIndicatorRing,
    customColor,
}: Readonly<LocalPlayerNodeProps>) {
    const gameState = useContext(GameCtx);
    const spawn = SPAWN_POSITIONS[playerId];

    const [replay] = useStore(ReplayStore);
    const [cooldown] = useStore(DashCooldownStore);
    const [velocities] = useStore(PlayerVelocityStore);

    useStableId(`player-${playerId}`);
    useComponent(PlayerTag);

    const transform = useComponent(Transform);
    transform.localPosition.set(...spawn);

    // --- Physics ---
    const body = useRigidBody({
        type: 'dynamic',
        mass: 1,
        linearDamping: LINEAR_DAMPING,
        angularDamping: 1,
    });
    body.setInertiaTensor(0, 0, 0);

    // --- Network replication ---
    let publishKnockout: ((id: number) => void) | null = null;
    if (replicate) {
        useReplicateTransform({
            role: 'producer',
            readVelocity: () => body.linearVelocity,
        });
        const knockoutCh = useChannel(KnockoutChannel);
        publishKnockout = (id) => knockoutCh.publish(id);
    }

    useSphereCollider(PLAYER_RADIUS, {
        friction: 0.3,
        restitution: 0.2,
    });

    // --- Input ---
    const getMove = useAxis2D(moveAction);
    const getDash = useAction(dashAction);

    // --- Dash ---
    const dash = useDash();

    // --- Visual ---
    const meshColor = customColor ?? PLAYER_COLORS[playerId];
    const { root } = useMesh('sphere', {
        radius: PLAYER_RADIUS,
        color: meshColor,
        emissive: meshColor,
        emissiveIntensity: 0.15,
        roughness: 0.35,
        metalness: 0.4,
        castShadow: true,
    });

    let shouldSnap = false;
    useInterpolatedPosition(transform, root, {
        snap: () => {
            if (shouldSnap) {
                shouldSnap = false;
                return true;
            }
            return false;
        },
    });

    // --- Indicator ring ---
    const ring = useIndicatorRing(
        !!replicate || !!showIndicatorRing,
        PLAYER_RADIUS,
    );

    // --- Shockwave / hit impact pools ---
    const shockwavePool = useShockwavePool();
    const hitImpactPool = useHitImpactPool();
    const { camera: threeCamera } = useThreeContext();

    // --- Sound effects ---
    useSoundGroup('sfx');

    const dashSfx = useSound('noise', {
        filter: 'bandpass',
        frequency: [2000, 500],
        duration: 0.15,
        gain: 0.12,
        group: 'sfx',
    });
    const deathSfx = useSound('tone', {
        wave: 'sawtooth',
        frequency: [600, 150],
        duration: 0.2,
        gain: 0.12,
        group: 'sfx',
    });
    const impactSfx = useSound('tone', {
        ...IMPACT_SOUND_CONFIG,
        group: 'sfx',
    });

    // --- Particle effects ---
    const impactBurst = useParticleBurst(IMPACT_BURST_CONFIG);

    const knockoutBurst = useParticleBurst({
        count: KNOCKOUT_BURST_COUNT,
        lifetime: 0.6,
        color: meshColor,
        speed: [2, 6],
        gravity: 8,
        size: 0.4,
        blending: 'additive',
        shrink: true,
    });

    const trailBurst = useParticleBurst({
        ...TRAIL_BURST_CONFIG,
        color: meshColor,
    });
    const trail = createTrailEmitter();

    // --- Knockback ---
    useKnockback({
        body,
        transform,
        dash,
        playerId,
        replicate: !!replicate,
        impactSfx,
        impactBurst,
        shockwavePool,
        hitImpactPool,
        threeCamera: threeCamera as KnockbackDeps['threeCamera'],
        replay,
        velocityStates: velocities.states,
        playerRadius: PLAYER_RADIUS,
        getPhase: () => gameState.phase,
    });

    // --- Round / phase tracking ---
    let lastRound = gameState.round;
    let knockedOut = false;
    let lastPhase = gameState.phase;
    let lastFramePhase = gameState.phase;

    // --- Fixed update: movement, dash, death plane ---
    useFixedUpdate((dt) => {
        stagePlayerPosition(
            replay,
            playerId,
            transform.localPosition.x,
            transform.localPosition.y,
            transform.localPosition.z,
        );
        setPlayerPosition(
            playerId,
            transform.localPosition.x,
            transform.localPosition.y,
            transform.localPosition.z,
        );
        updatePlayerVelocity(
            velocities.states,
            playerId,
            transform.localPosition.x,
            transform.localPosition.z,
            dt,
        );

        // Round reset
        if (gameState.round !== lastRound) {
            lastRound = gameState.round;
            knockedOut = false;
            root.visible = true;
            transform.localPosition.set(...spawn);
            body.setLinearVelocity(0, 0, 0);
            dash.timer.cancel();
            dash.cooldown.reset();
            shouldSnap = true;
        }

        // Phase transition
        if (gameState.phase === 'playing' && lastPhase !== 'playing') {
            dash.cooldown.trigger();
        }
        lastPhase = gameState.phase;

        // Freeze during non-playing phases
        if (gameState.phase !== 'playing') {
            body.setLinearVelocity(0, 0, 0);
            dash.timer.cancel();

            if (gameState.phase === 'replay') {
                const replayPos = getReplayPosition(replay, playerId);
                if (replayPos) {
                    transform.localPosition.set(
                        replayPos[0],
                        replayPos[1],
                        replayPos[2],
                    );
                }
            }

            if (!knockedOut && transform.localPosition.y < DEATH_PLANE_Y) {
                transform.localPosition.set(...spawn);
                body.setLinearVelocity(0, 0, 0);
            }
            return;
        }

        const move = getMove();
        const dashActionState = getDash();

        // Dash activation
        tryActivateDash(dash, move.x, move.y, dashActionState.pressed, () =>
            dashSfx.play(),
        );

        if (dash.timer.active) {
            const vy = body.linearVelocity.y;
            body.setLinearVelocity(
                dash.dirX * DASH_SPEED,
                vy,
                dash.dirZ * DASH_SPEED,
            );
        } else {
            const ix = move.x * MOVE_IMPULSE;
            const iz = -move.y * MOVE_IMPULSE;
            if (ix !== 0 || iz !== 0) {
                body.applyImpulse(ix, 0, iz);
            }
        }

        // Death plane
        if (!knockedOut && transform.localPosition.y < DEATH_PLANE_Y) {
            knockoutBurst([
                transform.localPosition.x,
                transform.localPosition.y,
                transform.localPosition.z,
            ]);
            deathSfx.play();
            if (gameState.pendingKnockout >= 0) {
                gameState.pendingKnockout2 = playerId;
            } else {
                gameState.pendingKnockout = playerId;
            }
            if (publishKnockout) publishKnockout(playerId);
            knockedOut = true;
            root.visible = false;
            body.setLinearVelocity(0, 0, 0);
            dash.timer.cancel();
            dash.cooldown.reset();
        }
    });

    // --- Frame update: visual, trail, indicator ring, HUD ---
    useFrameUpdate((dt) => {
        // Dash cooldown HUD sync
        const enteringPlaying =
            gameState.phase === 'playing' && lastFramePhase !== 'playing';
        lastFramePhase = gameState.phase;
        cooldown.progress[playerId] = enteringPlaying
            ? 0
            : dash.cooldown.ready
              ? 1
              : 1 - dash.cooldown.remaining / DASH_COOLDOWN;

        // Replay position override
        const replayPos = getReplayPosition(replay, playerId);
        if (replayPos) {
            root.visible = true;
            root.position.set(replayPos[0], replayPos[1], replayPos[2]);
        } else if (knockedOut) {
            root.visible = false;
        } else {
            root.visible = true;
        }

        // Trail particles
        const vx = body.linearVelocity.x;
        const vz = body.linearVelocity.z;
        const vmag = Math.sqrt(vx * vx + vz * vz);
        trail.update(dt, vmag, gameState.phase === 'playing', () => {
            trailBurst([root.position.x, root.position.y, root.position.z]);
        });

        // Indicator ring
        ring.updatePosition(root.position, gameState.phase === 'playing');
    });
}
