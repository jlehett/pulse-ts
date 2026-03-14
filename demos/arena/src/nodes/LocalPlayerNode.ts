import {
    useComponent,
    useFixedEarly,
    useFixedUpdate,
    useFrameUpdate,
    useContext,
    useStableId,
    useNode,
    getComponent,
    Transform,
    useTimer,
    useCooldown,
    useDestroy,
    useStore,
    color,
} from '@pulse-ts/core';
import { useAxis2D, useAction } from '@pulse-ts/input';
import {
    useRigidBody,
    useSphereCollider,
    useOnCollisionStart,
} from '@pulse-ts/physics';
import {
    useMesh,
    useThreeContext,
    useInterpolatedPosition,
    useScreenProjection,
} from '@pulse-ts/three';
import { useSound } from '@pulse-ts/audio';
import { useParticleBurst } from '@pulse-ts/effects';
import { useReplicateTransform, useChannel } from '@pulse-ts/network';
import { PlayerTag } from '../components/PlayerTag';
import { GameCtx } from '../contexts';
import {
    SPAWN_POSITIONS,
    DEATH_PLANE_Y,
    PLAYER_COLORS,
    TRAIL_VELOCITY_REFERENCE,
    TRAIL_BASE_INTERVAL,
} from '../config/arena';
import { KnockoutChannel } from '../config/channels';
import { triggerCameraShake } from './CameraRigNode';
import {
    ReplayStore,
    stagePlayerPosition,
    markHit,
    getReplayPosition,
} from '../replay';
import { ShockwaveStore, triggerShockwave, worldToScreen } from '../shockwave';
import { HitImpactStore, triggerHitImpact } from '../hitImpact';
import { setPlayerPosition } from '../ai/playerPositions';
import { DashCooldownStore } from '../dashCooldown';
import {
    PlayerVelocityStore,
    updatePlayerVelocity,
    getPlayerVelocity,
} from '../playerVelocity';

/** Sphere radius for the player ball. */
export const PLAYER_RADIUS = 0.8;

/** Impulse applied per fixed tick when movement input is held. */
export const MOVE_IMPULSE = 0.6;

/** Linear damping — lower values mean longer coasting and harder to control. */
export const LINEAR_DAMPING = 0.25;

/** Velocity applied during a dash. */
export const DASH_SPEED = 24;

/** Duration of a dash in seconds. */
export const DASH_DURATION = 0.15;

/** Cooldown between dashes in seconds. */
export const DASH_COOLDOWN = 1.0;

/**
 * Minimum knockback applied even when both players have zero closing speed.
 * Ensures standing collisions still produce a visible bump.
 */
export const KNOCKBACK_BASE = 15;

/**
 * Knockback scaling factor per unit of the other player's approach speed.
 * Only the opponent's velocity into you affects your knockback — your own
 * speed does not amplify the hit you receive.
 * Effective knockback: `KNOCKBACK_BASE + theirApproach * KNOCKBACK_VELOCITY_SCALE`
 */
export const KNOCKBACK_VELOCITY_SCALE = 0.3;

/** Minimum seconds between collision impact sounds. */
export const IMPACT_COOLDOWN = 0.4;

/** Number of particles in the knockout mega-burst. */
export const KNOCKOUT_BURST_COUNT = 80;

/** Color of the online-mode "you" indicator ring (hex). */
export const INDICATOR_RING_COLOR = 0xffee88;

/** Screen-space scale multiplier vs projected player radius. */
export const INDICATOR_RING_SCALE = 1.5;

/** Border width of the indicator ring in pixels. */
export const INDICATOR_RING_BORDER = 2;

/**
 * Compute a knockback impulse vector from one position to another.
 * The impulse points away from the other player and is scaled by the
 * given magnitude. Includes an upward component for arc.
 *
 * @param selfX - Local player X position.
 * @param selfZ - Local player Z position.
 * @param otherX - Other player X position.
 * @param otherZ - Other player Z position.
 * @param magnitude - Impulse strength.
 * @returns An `[x, y, z]` impulse vector.
 *
 * @example
 * ```ts
 * computeKnockback(0, 0, -1, 0, 8); // [8, 0, 0] — pushed right
 * ```
 */
export function computeKnockback(
    selfX: number,
    selfZ: number,
    otherX: number,
    otherZ: number,
    magnitude: number,
): [number, number, number] {
    const dx = selfX - otherX;
    const dz = selfZ - otherZ;
    const len = Math.sqrt(dx * dx + dz * dz);
    if (len > 0) {
        return [(dx / len) * magnitude, 0, (dz / len) * magnitude];
    }
    // Overlapping — push in arbitrary direction
    return [magnitude, 0, 0];
}

/**
 * Compute how fast a body is moving **toward** a target position.
 * Returns the component of the attacker's velocity along the direction
 * from attacker to target (clamped to >= 0 — retreating gives 0).
 *
 * @param selfX - Target player X.
 * @param selfZ - Target player Z.
 * @param otherX - Attacker X.
 * @param otherZ - Attacker Z.
 * @param otherVx - Attacker velocity X.
 * @param otherVz - Attacker velocity Z.
 * @returns Approach speed (>= 0). Zero for glancing or retreating movement.
 *
 * @example
 * ```ts
 * // Attacker at (-5,0) moving at (10,0) toward target at (0,0)
 * computeApproachSpeed(0, 0, -5, 0, 10, 0); // 10
 *
 * // Attacker moving perpendicular — glancing blow
 * computeApproachSpeed(0, 0, -5, 0, 0, 10); // 0
 * ```
 */
export function computeApproachSpeed(
    selfX: number,
    selfZ: number,
    otherX: number,
    otherZ: number,
    otherVx: number,
    otherVz: number,
): number {
    const dx = selfX - otherX;
    const dz = selfZ - otherZ;
    const len = Math.sqrt(dx * dx + dz * dz);
    if (len < 0.01) {
        // Overlapping — use full velocity magnitude as approach speed
        return Math.sqrt(otherVx * otherVx + otherVz * otherVz);
    }
    // Dot product of velocity with direction toward self, clamped to >= 0
    const dot = (otherVx * dx + otherVz * dz) / len;
    return Math.max(0, dot);
}

/**
 * Compute the normalized dash direction from a movement input vector.
 * If the input is zero-length, defaults to forward (negative Z).
 *
 * @param moveX - Horizontal input axis value.
 * @param moveY - Vertical input axis value (W/up = positive).
 * @returns A normalized `[x, z]` direction tuple in world space.
 *
 * @example
 * ```ts
 * computeDashDirection(1, 0);  // [1, 0]  — dash right
 * computeDashDirection(0, 1);  // [0, -1] — dash forward
 * computeDashDirection(0, 0);  // [0, -1] — default forward
 * ```
 */
export function computeDashDirection(
    moveX: number,
    moveY: number,
): [number, number] {
    const len = Math.sqrt(moveX * moveX + moveY * moveY);
    if (len > 0) {
        return [moveX / len, -moveY / len]; // W = forward = -Z
    }
    return [0, -1]; // default forward
}

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
    const node = useNode();
    const gameState = useContext(GameCtx);
    const spawn = SPAWN_POSITIONS[playerId];

    const [replay] = useStore(ReplayStore);
    const [shockwaves] = useStore(ShockwaveStore);
    const [impacts] = useStore(HitImpactStore);
    const [cooldown] = useStore(DashCooldownStore);
    const [velocities] = useStore(PlayerVelocityStore);

    useStableId(`player-${playerId}`);

    useComponent(PlayerTag);

    const transform = useComponent(Transform);
    transform.localPosition.set(...spawn);

    const body = useRigidBody({
        type: 'dynamic',
        mass: 1,
        linearDamping: LINEAR_DAMPING,
        angularDamping: 1,
    });
    // Lock rotation so the ball doesn't tumble
    body.setInertiaTensor(0, 0, 0);

    // Replicate after body is created so we can include velocity for
    // dead-reckoning on the consumer side.
    let publishKnockout: ((id: number) => void) | null = null;
    let publishKnockback: ((impulse: [number, number, number]) => void) | null =
        null;

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

    const getMove = useAxis2D(moveAction);
    const getDash = useAction(dashAction);

    // Dash state
    const dashTimer = useTimer(DASH_DURATION);
    const dashCD = useCooldown(DASH_COOLDOWN);
    const impactCD = useCooldown(IMPACT_COOLDOWN);
    let dashDirX = 0;
    let dashDirZ = 0;

    // Track round number to detect round resets via shared state
    let lastRound = gameState.round;

    // Tracks whether this player has been knocked out this round.
    // While true the mesh is hidden and death-plane resets are suppressed.
    let knockedOut = false;

    // Track phase to detect transition into 'playing' (fixed update + frame update)
    let lastPhase = gameState.phase;
    let lastFramePhase = gameState.phase;

    // Snapshot velocity before the physics solver runs. In online mode,
    // the solver applies a bounce against the kinematic remote player
    // that's stronger than the local-play bounce (100% vs 50/50 split).
    // We capture pre-solver velocity so the collision handler can undo
    // the physics bounce and apply only our controlled knockback impulse.
    let prePhysVx = 0;
    let prePhysVz = 0;
    if (replicate) {
        useFixedEarly(() => {
            prePhysVx = body.linearVelocity.x;
            prePhysVz = body.linearVelocity.z;
        });
    }

    // Visual — sphere mesh with subtle emissive glow (blooms under post-processing)
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

    // Smooth interpolation from fixed-step transform to render-frame root position.
    // Snap on round reset to avoid interpolation sweep across the arena.
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

    // Screen projection for indicator ring positioning
    const project = useScreenProjection();

    // Online mode indicator ring — screen-space CSS circle, always centered on the ball
    const { renderer: threeRenderer, camera: threeCamera } = useThreeContext();
    let indicatorRing: HTMLDivElement | null = null;

    if (replicate || showIndicatorRing) {
        const container =
            threeRenderer.domElement.parentElement ?? document.body;
        indicatorRing = document.createElement('div');
        const indicatorColor = color(INDICATOR_RING_COLOR);
        const cssColor = indicatorColor.rgba(0.7);
        const glowColor = indicatorColor.rgba(0.4);
        Object.assign(indicatorRing.style, {
            position: 'absolute',
            borderRadius: '50%',
            border: `${INDICATOR_RING_BORDER}px solid ${cssColor}`,
            boxShadow: `0 0 8px ${glowColor}`,
            pointerEvents: 'none',
            zIndex: '999',
        } as Partial<CSSStyleDeclaration>);
        container.appendChild(indicatorRing);

        useDestroy(() => indicatorRing!.remove());
    }

    // Sound effects
    const dashSfx = useSound('noise', {
        filter: 'bandpass',
        frequency: [2000, 500],
        duration: 0.15,
        gain: 0.12,
    });
    const deathSfx = useSound('tone', {
        wave: 'sawtooth',
        frequency: [600, 150],
        duration: 0.2,
        gain: 0.12,
    });
    const impactSfx = useSound('tone', {
        wave: 'square',
        frequency: [300, 100],
        duration: 0.1,
        gain: 0.15,
    });

    // Particle burst for collision impact
    const impactBurst = useParticleBurst({
        count: 16,
        lifetime: 0.4,
        color: 0xffffff,
        speed: [1, 3],
        gravity: 6,
        size: 0.3,
        blending: 'additive',
    });

    // Knockout mega-burst — player-colored explosion on death
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

    // Velocity-proportional trail burst — emitted when moving fast
    const trailBurst = useParticleBurst({
        count: 8,
        lifetime: 1.0,
        color: meshColor,
        speed: [0.2, 0.8],
        gravity: 1,
        size: 0.4,
        blending: 'additive',
        shrink: true,
    });
    let trailAccum = 0;

    // --- Shared knockback application helper ---
    // Used by both the local collision handler and the remote knockback
    // channel handler to apply impulse + VFX in one place.
    const applyKnockbackEffects = (impulse: [number, number, number]): void => {
        body.applyImpulse(impulse[0], impulse[1], impulse[2]);

        // Cancel any active dash and reset cooldown
        dashTimer.cancel();
        dashCD.trigger();

        impactSfx.play();
        impactCD.trigger();

        // Particle burst — at the surface facing the hit direction
        const hx = -impulse[0];
        const hz = -impulse[2];
        const hLen = Math.sqrt(hx * hx + hz * hz);
        if (hLen > 0) {
            const surfX =
                transform.localPosition.x + (hx / hLen) * PLAYER_RADIUS;
            const surfY = transform.localPosition.y;
            const surfZ =
                transform.localPosition.z + (hz / hLen) * PLAYER_RADIUS;
            impactBurst([surfX, surfY, surfZ]);

            const [su, sv] = worldToScreen(surfX, surfY, surfZ, threeCamera);
            triggerShockwave(shockwaves.slots, su, sv);
            triggerHitImpact(impacts.slots, surfX, surfZ);
        }

        triggerCameraShake(0.3, 0.2);
        markHit(replay);
    };

    // --- Bidirectional knockback channel (online mode) ---
    // Both players send the OTHER player's computed impulse on collision.
    // If the receiver already handled the collision locally (impactCD active),
    // the message is ignored (dedup). If only the sender detected the
    // collision, the receiver applies the impulse from the message.
    if (replicate) {
        const kb = useChannel<[number, number, number]>(
            'knockback',
            (impulse) => {
                if (gameState.phase !== 'playing') return;
                // Dedup: if we already handled a collision locally, skip.
                // impactCD is triggered in the collision handler and stays
                // active for IMPACT_COOLDOWN (0.4s), well beyond any message
                // delivery time.
                if (!impactCD.ready) return;

                // This side didn't detect the collision — no solver ran, so
                // we still have our full approach velocity. In local play the
                // solver would stop us first (v: -24 → ~0), then knockback
                // pushes us away (+31). Without correction, the impulse
                // fights the approach velocity (-24 + 31 = +7 instead of +31).
                //
                // Fix: strip velocity component toward the opponent (inferred
                // from the impulse direction, which points AWAY from them).
                const imag = Math.sqrt(
                    impulse[0] * impulse[0] + impulse[2] * impulse[2],
                );
                if (imag > 0.01) {
                    // Normal pointing away from opponent (same as impulse dir)
                    const awayX = impulse[0] / imag;
                    const awayZ = impulse[2] / imag;
                    // Our velocity component toward the opponent (negative of
                    // away direction)
                    const towardComponent =
                        body.linearVelocity.x * -awayX +
                        body.linearVelocity.z * -awayZ;
                    // Only strip if we're moving toward them (positive value)
                    if (towardComponent > 0) {
                        body.linearVelocity.x += towardComponent * awayX;
                        body.linearVelocity.z += towardComponent * awayZ;
                    }
                }

                applyKnockbackEffects(impulse);
            },
        );
        publishKnockback = (impulse) => kb.publish(impulse);
    }

    // Knockback on collision with another player.
    //
    // TIMING: useOnCollisionStart fires AFTER the physics solver has resolved
    // the contact. In online mode, the solver applies a bounce against the
    // kinematic remote body that's stronger than local play (100% vs 50/50).
    // We halve the solver's velocity change to match local-play physics.
    //
    // In online mode, both players compute knockback locally AND send the
    // other player's impulse via the knockback channel. If only one side
    // detects the collision, the other side receives and applies the impulse.
    // The impactCD cooldown deduplicates — if both detect, the channel
    // message is ignored.
    useOnCollisionStart(({ other }) => {
        if (other === node) return;
        if (!getComponent(other, PlayerTag)) return;
        // Prevent double-hits from rapid re-collision (physics bounce)
        if (!impactCD.ready) return;

        const otherTransform = getComponent(other, Transform);
        if (!otherTransform) return;

        // In online mode, correct the physics solver's velocity bounce.
        // The solver treated the kinematic remote body as an immovable wall
        // with zero velocity. The simple halving trick works when the remote
        // player is stationary, but when BOTH players are moving toward each
        // other the residual velocity pointing at the opponent can exceed the
        // knockback impulse, causing the players to "stick."
        //
        // Fix: replace the solver's result with the proper equal-mass elastic
        // collision formula using the remote player's known velocity. Only
        // the normal (along collision axis) component is corrected; tangential
        // velocity (glancing blows) is preserved from the solver.
        const otherPlayerId = 1 - playerId;
        const [otherVx, otherVz] = getPlayerVelocity(
            velocities.states,
            otherPlayerId,
        );

        if (replicate) {
            const cdx =
                otherTransform.localPosition.x - transform.localPosition.x;
            const cdz =
                otherTransform.localPosition.z - transform.localPosition.z;
            const clen = Math.sqrt(cdx * cdx + cdz * cdz);
            if (clen > 0.01) {
                const nx = cdx / clen;
                const nz = cdz / clen;
                // Our pre-solver normal velocity (toward opponent)
                const myNormal = prePhysVx * nx + prePhysVz * nz;
                // Other player's normal velocity (toward us, from their perspective)
                const otherNormal = otherVx * nx + otherVz * nz;
                // Equal-mass collision: exchange normal components (e=0.2)
                const e = 0.2;
                const correctedNormal =
                    ((1 - e) / 2) * myNormal + ((1 + e) / 2) * otherNormal;
                // Strip the solver's normal velocity and replace with ours
                const solverNormal =
                    body.linearVelocity.x * nx + body.linearVelocity.z * nz;
                body.linearVelocity.x += (correctedNormal - solverNormal) * nx;
                body.linearVelocity.z += (correctedNormal - solverNormal) * nz;
            } else {
                // Overlapping — just zero out horizontal velocity
                body.linearVelocity.x = 0;
                body.linearVelocity.z = 0;
            }
        }
        const approachSpeed = computeApproachSpeed(
            transform.localPosition.x,
            transform.localPosition.z,
            otherTransform.localPosition.x,
            otherTransform.localPosition.z,
            otherVx,
            otherVz,
        );
        const effectiveForce =
            KNOCKBACK_BASE + approachSpeed * KNOCKBACK_VELOCITY_SCALE;

        // Impulse applied to US (pushed away from the other player)
        const [ix, iy, iz] = computeKnockback(
            transform.localPosition.x,
            transform.localPosition.z,
            otherTransform.localPosition.x,
            otherTransform.localPosition.z,
            effectiveForce,
        );

        applyKnockbackEffects([ix, iy, iz]);

        // In online mode, also compute and send the OTHER player's knockback
        // so they can apply it if their physics didn't detect the collision.
        if (publishKnockback) {
            const [myVx, myVz] = getPlayerVelocity(velocities.states, playerId);
            const myApproach = computeApproachSpeed(
                otherTransform.localPosition.x,
                otherTransform.localPosition.z,
                transform.localPosition.x,
                transform.localPosition.z,
                myVx,
                myVz,
            );
            const otherForce =
                KNOCKBACK_BASE + myApproach * KNOCKBACK_VELOCITY_SCALE;

            const [ox, oy, oz] = computeKnockback(
                otherTransform.localPosition.x,
                otherTransform.localPosition.z,
                transform.localPosition.x,
                transform.localPosition.z,
                otherForce,
            );

            publishKnockback([ox, oy, oz]);
        }
    });

    useFixedUpdate((dt) => {
        // Stage position for replay recording and shared position store
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

        // Round reset — teleport to spawn when GameManagerNode increments round.
        if (gameState.round !== lastRound) {
            lastRound = gameState.round;
            knockedOut = false;
            root.visible = true;
            transform.localPosition.set(...spawn);
            body.setLinearVelocity(0, 0, 0);
            dashTimer.cancel();
            dashCD.reset();
            shouldSnap = true;
        }

        // Trigger dash cooldown when the playing phase starts so the
        // cooldown begins when the player actually gains control, not
        // during the countdown when it would silently expire.
        if (gameState.phase === 'playing' && lastPhase !== 'playing') {
            dashCD.trigger();
        }
        lastPhase = gameState.phase;

        // Freeze input during non-playing phases
        if (gameState.phase !== 'playing') {
            body.setLinearVelocity(0, 0, 0);
            dashTimer.cancel();

            // During replay, drive transform from the replay buffer so
            // trsSync (which runs after useFrameUpdate) picks up the position.
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

            // Still check death plane during freeze for safety
            if (!knockedOut && transform.localPosition.y < DEATH_PLANE_Y) {
                transform.localPosition.set(...spawn);
                body.setLinearVelocity(0, 0, 0);
            }
            return;
        }

        const move = getMove();
        const dashAction = getDash();

        // Dash activation
        if (dashAction.pressed && dashCD.ready && !dashTimer.active) {
            [dashDirX, dashDirZ] = computeDashDirection(move.x, move.y);
            dashTimer.reset();
            dashCD.trigger();
            dashSfx.play();
        }

        if (dashTimer.active) {
            // During dash, override horizontal velocity with locked direction
            const vy = body.linearVelocity.y;
            body.setLinearVelocity(
                dashDirX * DASH_SPEED,
                vy,
                dashDirZ * DASH_SPEED,
            );
        } else {
            // Momentum-based movement — apply impulse, damping handles deceleration
            const ix = move.x * MOVE_IMPULSE;
            const iz = -move.y * MOVE_IMPULSE;
            if (ix !== 0 || iz !== 0) {
                body.applyImpulse(ix, 0, iz);
            }
        }

        // Death plane — hide mesh on knockout; actual respawn deferred to round reset
        if (!knockedOut && transform.localPosition.y < DEATH_PLANE_Y) {
            knockoutBurst([
                transform.localPosition.x,
                transform.localPosition.y,
                transform.localPosition.z,
            ]);
            deathSfx.play();
            // Use pendingKnockout2 if the first slot is already occupied
            // (two players falling in the same tie window)
            if (gameState.pendingKnockout >= 0) {
                gameState.pendingKnockout2 = playerId;
            } else {
                gameState.pendingKnockout = playerId;
            }
            if (publishKnockout) publishKnockout(playerId);
            knockedOut = true;
            root.visible = false;
            body.setLinearVelocity(0, 0, 0);
            dashTimer.cancel();
            dashCD.reset();
        }
    });

    // Interpolate visual position for smooth rendering
    useFrameUpdate((dt) => {
        // Update dash cooldown progress for HUD indicators.
        // On the frame 'playing' starts, force 0 — the fixed-step
        // dashCD.trigger() hasn't fired yet so dashCD.ready is stale.
        const enteringPlaying =
            gameState.phase === 'playing' && lastFramePhase !== 'playing';
        lastFramePhase = gameState.phase;
        cooldown.progress[playerId] = enteringPlaying
            ? 0
            : dashCD.ready
              ? 1
              : 1 - dashCD.remaining / DASH_COOLDOWN;
        // During replay, override mesh position from the replay buffer.
        // When knocked out (between death and round reset), hide the mesh
        // so there's no visible snap-to-spawn before the replay finishes.
        const replayPos = getReplayPosition(replay, playerId);
        if (replayPos) {
            root.visible = true;
            root.position.set(replayPos[0], replayPos[1], replayPos[2]);
        } else if (knockedOut) {
            root.visible = false;
        } else {
            root.visible = true;
        }

        // Velocity-proportional trail particles during gameplay
        if (gameState.phase === 'playing') {
            const vx = body.linearVelocity.x;
            const vz = body.linearVelocity.z;
            const vmag = Math.sqrt(vx * vx + vz * vz);
            if (vmag > 0.1) {
                trailAccum += dt;
                const interval = Math.max(
                    0.01,
                    TRAIL_BASE_INTERVAL / (vmag / TRAIL_VELOCITY_REFERENCE),
                );
                if (trailAccum >= interval) {
                    trailAccum = 0;
                    trailBurst([
                        root.position.x,
                        root.position.y,
                        root.position.z,
                    ]);
                }
            } else {
                trailAccum = 0;
            }
        } else {
            trailAccum = 0;
        }

        // Update indicator ring screen position
        // Visible during playing and intro phases; hidden otherwise
        if (indicatorRing) {
            if (gameState.phase !== 'playing') {
                indicatorRing.style.display = 'none';
            } else {
                indicatorRing.style.display = '';

                // Project player center to screen
                const center = project(root.position);
                const sx = center.x;
                const sy = center.y;

                // Project edge point to get screen-space radius
                const edge = project({
                    x: root.position.x + PLAYER_RADIUS * INDICATOR_RING_SCALE,
                    y: root.position.y,
                    z: root.position.z,
                });
                const radius = Math.abs(edge.x - sx);
                const size = radius * 2;

                indicatorRing.style.width = `${size}px`;
                indicatorRing.style.height = `${size}px`;
                indicatorRing.style.left = `${sx - radius}px`;
                indicatorRing.style.top = `${sy - radius}px`;
            }
        }
    });
}
