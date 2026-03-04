/**
 * Frame-to-frame mutable state for an AI opponent.
 *
 * Managed by {@link AiPlayerNode} and passed into
 * {@link computeAiDecision} each tick. Tracks velocities,
 * collisions, scores, and behavioral mode timers that
 * enable stateful personality knobs (grudge, ambush, rhythm, etc.).
 */
export interface AiState {
    // ----- Timing -----

    /** Total elapsed time in the playing phase (seconds). */
    elapsed: number;

    // ----- Position / velocity tracking -----

    /** Previous frame self position. */
    prevSelfX: number;
    prevSelfZ: number;

    /** Previous frame opponent position. */
    prevOpX: number;
    prevOpZ: number;

    /** Self velocity estimated from position deltas. */
    selfVelX: number;
    selfVelZ: number;

    /** Opponent velocity estimated from position deltas. */
    opVelX: number;
    opVelZ: number;

    // ----- Previous output (for momentumCommitment) -----

    /** Previous frame's output direction (before speed scaling). */
    prevDirX: number;
    prevDirZ: number;

    // ----- Collision detection -----

    /**
     * Seconds since the last detected collision.
     * Set to 0 when a collision is detected, increments each frame.
     */
    timeSinceCollision: number;

    /** Whether positions were initialized (first frame guard). */
    initialized: boolean;

    // ----- Score tracking -----

    /** AI's own score. */
    selfScore: number;

    /** Opponent's score. */
    opponentScore: number;

    // ----- Smoothed perception (reactionDelay) -----

    /** Smoothed opponent position (delayed perception). */
    perceivedOpX: number;
    perceivedOpZ: number;

    // ----- Behavioral timers -----

    /** Oscillation phase for burstiness (0–2π). */
    burstPhase: number;

    /** Oscillation phase for rhythm (0–2π). */
    rhythmPhase: number;

    /** Current personality phase index for phaseShift. */
    phaseIndex: number;

    /** Timer for phase shift cycling (seconds). */
    phaseTimer: number;

    /** Time spent in current commit window (seconds). 0 = not committing. */
    commitTimer: number;

    /** Whether the AI is in commit (pressure) mode. */
    commitActive: boolean;

    /** Phase of feint cycle (seconds). */
    feintPhase: number;

    /** Ambush cooldown — seconds until next ambush attempt. */
    ambushCooldown: number;

    /** Whether the AI is currently lying in wait (ambush mode). */
    ambushActive: boolean;

    /** Post-hit pause remaining (seconds). */
    postHitTimer: number;

    // ----- Opponent dash detection -----

    /** Previous frame's opponent speed magnitude. */
    opPrevSpeed: number;

    /** Seconds since opponent last started a speed spike (dash). */
    timeSinceOpDash: number;

    // ----- Territory -----

    /** Home zone center X (set to spawn position). */
    homeX: number;

    /** Home zone center Z (set to spawn position). */
    homeZ: number;
}

/**
 * Create a fresh AI state with neutral initial values.
 *
 * @returns A new {@link AiState} ready for the first frame.
 *
 * @example
 * ```ts
 * const state = createAiState();
 * ```
 */
export function createAiState(): AiState {
    return {
        elapsed: 0,
        prevSelfX: 0,
        prevSelfZ: 0,
        prevOpX: 0,
        prevOpZ: 0,
        selfVelX: 0,
        selfVelZ: 0,
        opVelX: 0,
        opVelZ: 0,
        prevDirX: 0,
        prevDirZ: -1,
        timeSinceCollision: 999,
        initialized: false,
        selfScore: 0,
        opponentScore: 0,
        perceivedOpX: 0,
        perceivedOpZ: 0,
        burstPhase: 0,
        rhythmPhase: 0,
        phaseIndex: 0,
        phaseTimer: 0,
        commitTimer: 0,
        commitActive: false,
        feintPhase: 0,
        ambushCooldown: 0,
        ambushActive: false,
        postHitTimer: 0,
        opPrevSpeed: 0,
        timeSinceOpDash: 999,
        homeX: 0,
        homeZ: 0,
    };
}

/** Collision proximity threshold (slightly larger than 2× player radius). */
const COLLISION_THRESHOLD = 2.0;

/** Speed spike ratio that indicates a dash. */
const DASH_SPIKE_RATIO = 2.5;

/**
 * Advance the AI state by one frame. Call before {@link computeAiDecision}.
 *
 * Computes velocities from position deltas, detects collisions via
 * proximity + separation, detects opponent dashes via speed spikes,
 * and advances all behavioral timers.
 *
 * @param state - Mutable state object (modified in-place).
 * @param selfX - AI player X position this frame.
 * @param selfZ - AI player Z position this frame.
 * @param opX - Opponent X position this frame.
 * @param opZ - Opponent Z position this frame.
 * @param selfScore - AI's current score.
 * @param opScore - Opponent's current score.
 * @param dt - Fixed time step (seconds).
 *
 * @example
 * ```ts
 * updateAiState(state, selfX, selfZ, opX, opZ, scores[playerId], scores[1 - playerId], 1/60);
 * const decision = computeAiDecision(personality, state, ...);
 * ```
 */
export function updateAiState(
    state: AiState,
    selfX: number,
    selfZ: number,
    opX: number,
    opZ: number,
    selfScore: number,
    opScore: number,
    dt: number,
): void {
    if (!state.initialized) {
        state.prevSelfX = selfX;
        state.prevSelfZ = selfZ;
        state.prevOpX = opX;
        state.prevOpZ = opZ;
        state.perceivedOpX = opX;
        state.perceivedOpZ = opZ;
        state.homeX = selfX;
        state.homeZ = selfZ;
        state.initialized = true;
        return;
    }

    state.elapsed += dt;

    // Compute velocities from position deltas
    const invDt = dt > 0 ? 1 / dt : 0;
    state.selfVelX = (selfX - state.prevSelfX) * invDt;
    state.selfVelZ = (selfZ - state.prevSelfZ) * invDt;
    state.opVelX = (opX - state.prevOpX) * invDt;
    state.opVelZ = (opZ - state.prevOpZ) * invDt;

    // Collision detection via proximity + separation
    const prevDist = Math.sqrt(
        (state.prevSelfX - state.prevOpX) ** 2 +
            (state.prevSelfZ - state.prevOpZ) ** 2,
    );
    const curDist = Math.sqrt((selfX - opX) ** 2 + (selfZ - opZ) ** 2);
    if (prevDist < COLLISION_THRESHOLD && curDist > prevDist) {
        state.timeSinceCollision = 0;
    } else {
        state.timeSinceCollision += dt;
    }

    // Opponent dash detection via speed spike
    const opSpeed = Math.sqrt(
        state.opVelX * state.opVelX + state.opVelZ * state.opVelZ,
    );
    if (opSpeed > state.opPrevSpeed * DASH_SPIKE_RATIO && opSpeed > 15) {
        state.timeSinceOpDash = 0;
    } else {
        state.timeSinceOpDash += dt;
    }
    state.opPrevSpeed = opSpeed;

    // Score tracking
    state.selfScore = selfScore;
    state.opponentScore = opScore;

    // Advance oscillation phases
    state.burstPhase += dt * 3.0; // ~0.5Hz cycle
    state.rhythmPhase += dt;
    state.feintPhase += dt * 2.0; // ~0.3Hz cycle

    // Advance phase shift timer
    state.phaseTimer += dt;

    // Advance commit timer
    if (state.commitActive) {
        state.commitTimer += dt;
    }

    // Advance ambush cooldown
    if (state.ambushCooldown > 0) {
        state.ambushCooldown -= dt;
    }

    // Decay post-hit pause
    if (state.postHitTimer > 0) {
        state.postHitTimer -= dt;
    }

    // Store previous positions
    state.prevSelfX = selfX;
    state.prevSelfZ = selfZ;
    state.prevOpX = opX;
    state.prevOpZ = opZ;
}
