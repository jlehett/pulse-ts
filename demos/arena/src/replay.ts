import {
    REPLAY_BUFFER_SECONDS,
    REPLAY_NORMAL_SPEED,
    REPLAY_HIT_SPEED,
    REPLAY_HIT_WINDOW_FRAMES,
} from './config/arena';

/** Fixed-step rate (Hz). Must match the engine's fixed step. */
const FIXED_HZ = 60;

/** Maximum number of frames stored in the ring buffer. */
const BUFFER_SIZE = REPLAY_BUFFER_SECONDS * FIXED_HZ;

/** A single recorded frame: positions of both players. */
export interface ReplayFrame {
    p0x: number;
    p0y: number;
    p0z: number;
    p1x: number;
    p1y: number;
    p1z: number;
}

// ---------------------------------------------------------------------------
// Ring buffer — records player positions each fixed step
// ---------------------------------------------------------------------------

const buffer: ReplayFrame[] = [];
let writeCount = 0;
let lastHitWriteCount = -1;

// ---------------------------------------------------------------------------
// Playback state
// ---------------------------------------------------------------------------

let active = false;
let playbackFrames: ReplayFrame[] = [];
let hitIndex = -1;
let hadRealHit = false;
let cursorPos = 0;
let knockedOut = -1;
let scorer = -1;

// ---------------------------------------------------------------------------
// Per-player staging — each player writes its position, then commitFrame()
// pushes them into the ring buffer together.
// ---------------------------------------------------------------------------

let staged0x = 0;
let staged0y = 0;
let staged0z = 0;
let staged1x = 0;
let staged1y = 0;
let staged1z = 0;

// ---------------------------------------------------------------------------
// Recording API
// ---------------------------------------------------------------------------

/**
 * Stage a player's position for the current fixed step.
 * Call from each player node's `useFixedUpdate`. After both players have
 * staged, call {@link commitFrame} (typically from `useFixedLate`).
 *
 * @param playerId - Player index (0 or 1).
 * @param x - World X position.
 * @param y - World Y position.
 * @param z - World Z position.
 *
 * @example
 * ```ts
 * stagePlayerPosition(0, transform.localPosition.x, ...);
 * ```
 */
export function stagePlayerPosition(
    playerId: number,
    x: number,
    y: number,
    z: number,
): void {
    if (playerId === 0) {
        staged0x = x;
        staged0y = y;
        staged0z = z;
    } else {
        staged1x = x;
        staged1y = y;
        staged1z = z;
    }
}

/**
 * Commit the staged positions into the ring buffer as one frame.
 * Call once per fixed step after all players have staged their positions.
 *
 * @example
 * ```ts
 * useFixedLate(() => { commitFrame(); });
 * ```
 */
export function commitFrame(): void {
    recordFrame(staged0x, staged0y, staged0z, staged1x, staged1y, staged1z);
}

/**
 * Record both players' positions for one fixed step.
 * Lower-level API — prefer {@link stagePlayerPosition} + {@link commitFrame}
 * when players record independently.
 *
 * @param p0x - Player 0 X position.
 * @param p0y - Player 0 Y position.
 * @param p0z - Player 0 Z position.
 * @param p1x - Player 1 X position.
 * @param p1y - Player 1 Y position.
 * @param p1z - Player 1 Z position.
 *
 * @example
 * ```ts
 * recordFrame(p0.x, p0.y, p0.z, p1.x, p1.y, p1.z);
 * ```
 */
export function recordFrame(
    p0x: number,
    p0y: number,
    p0z: number,
    p1x: number,
    p1y: number,
    p1z: number,
): void {
    const idx = writeCount % BUFFER_SIZE;
    if (buffer.length <= idx) {
        buffer.push({ p0x, p0y, p0z, p1x, p1y, p1z });
    } else {
        const f = buffer[idx];
        f.p0x = p0x;
        f.p0y = p0y;
        f.p0z = p0z;
        f.p1x = p1x;
        f.p1y = p1y;
        f.p1z = p1z;
    }
    writeCount++;
}

/**
 * Mark the current frame as the "hit" moment (last collision before KO).
 * Call from the collision handler in the player node.
 *
 * @example
 * ```ts
 * useOnCollisionStart(() => { markHit(); });
 * ```
 */
export function markHit(): void {
    lastHitWriteCount = writeCount;
}

// ---------------------------------------------------------------------------
// Playback API
// ---------------------------------------------------------------------------

/**
 * Compute the playback speed at a given frame index.
 * Speed ramps from `REPLAY_HIT_SPEED` at the hit to `REPLAY_NORMAL_SPEED`
 * over `REPLAY_HIT_WINDOW_FRAMES` frames on either side.
 *
 * @param frameIndex - Index into the playback frames array.
 * @returns Playback speed as a fraction of real-time.
 *
 * @example
 * ```ts
 * getSpeedAtFrame(hitIndex);     // REPLAY_HIT_SPEED (0.15)
 * getSpeedAtFrame(hitIndex + 30); // REPLAY_NORMAL_SPEED (0.4)
 * ```
 */
export function getSpeedAtFrame(frameIndex: number): number {
    if (hitIndex < 0) return REPLAY_NORMAL_SPEED;
    const dist = Math.abs(frameIndex - hitIndex);
    if (dist >= REPLAY_HIT_WINDOW_FRAMES) return REPLAY_NORMAL_SPEED;
    const t = dist / REPLAY_HIT_WINDOW_FRAMES;
    return REPLAY_HIT_SPEED + (REPLAY_NORMAL_SPEED - REPLAY_HIT_SPEED) * t;
}

/**
 * Snapshot the ring buffer and begin replay playback.
 *
 * @param knockedOutPlayerId - ID of the player that was knocked out.
 *
 * @example
 * ```ts
 * startReplay(1); // player 1 was knocked out, player 0 is the scorer
 * ```
 */
export function startReplay(knockedOutPlayerId: number): void {
    knockedOut = knockedOutPlayerId;
    scorer = 1 - knockedOutPlayerId;

    // Extract recorded frames in chronological order
    const frameCount = Math.min(writeCount, BUFFER_SIZE);
    playbackFrames = [];
    const startWrite = writeCount - frameCount;
    for (let i = 0; i < frameCount; i++) {
        const bufIdx = (startWrite + i) % BUFFER_SIZE;
        const f = buffer[bufIdx];
        playbackFrames.push({
            p0x: f.p0x,
            p0y: f.p0y,
            p0z: f.p0z,
            p1x: f.p1x,
            p1y: f.p1y,
            p1z: f.p1z,
        });
    }

    // Map the hit index into the playback frames array
    if (lastHitWriteCount >= startWrite && lastHitWriteCount < writeCount) {
        hitIndex = lastHitWriteCount - startWrite;
        hadRealHit = true;
    } else {
        // No hit recorded — self-KO (player fell on their own)
        hitIndex = -1;
        hadRealHit = false;
    }

    cursorPos = 0;
    active = true;
}

/**
 * Advance the replay cursor by one frame's worth of real time.
 * Returns `true` while the replay is still playing, `false` when finished.
 *
 * @param dt - Real-time delta in seconds (from `useFrameUpdate`).
 * @returns Whether the replay is still active.
 *
 * @example
 * ```ts
 * useFrameUpdate((dt) => {
 *     if (!advanceReplay(dt)) { /* replay done *\/ }
 * });
 * ```
 */
export function advanceReplay(dt: number): boolean {
    if (!active || playbackFrames.length === 0) return false;

    const frameIdx = Math.floor(Math.min(cursorPos, playbackFrames.length - 1));
    const speed = getSpeedAtFrame(frameIdx);

    // Advance cursor: speed * FIXED_HZ frames per real-time second
    cursorPos += dt * speed * FIXED_HZ;

    if (cursorPos >= playbackFrames.length - 1) {
        active = false;
        return false;
    }
    return true;
}

/**
 * Get the interpolated position of a player at the current replay cursor.
 * Returns `null` when no replay is active.
 *
 * @param playerId - Player index (0 or 1).
 * @returns `[x, y, z]` position tuple, or `null` if replay is inactive.
 *
 * @example
 * ```ts
 * const pos = getReplayPosition(0);
 * if (pos) mesh.position.set(...pos);
 * ```
 */
export function getReplayPosition(
    playerId: number,
): [number, number, number] | null {
    if (!active || playbackFrames.length === 0) return null;

    const idx = Math.min(cursorPos, playbackFrames.length - 1);
    const i0 = Math.floor(idx);
    const i1 = Math.min(i0 + 1, playbackFrames.length - 1);
    const t = idx - i0;

    const f0 = playbackFrames[i0];
    const f1 = playbackFrames[i1];

    if (playerId === 0) {
        return [
            f0.p0x + (f1.p0x - f0.p0x) * t,
            f0.p0y + (f1.p0y - f0.p0y) * t,
            f0.p0z + (f1.p0z - f0.p0z) * t,
        ];
    }
    return [
        f0.p1x + (f1.p1x - f0.p1x) * t,
        f0.p1y + (f1.p1y - f0.p1y) * t,
        f0.p1z + (f1.p1z - f0.p1z) * t,
    ];
}

/** Whether a replay is currently active. */
export function isReplayActive(): boolean {
    return active;
}

/** The player ID of the scorer (winner) in the current/last replay. */
export function getReplayScorer(): number {
    return scorer;
}

/** The player ID that was knocked out in the current/last replay. */
export function getReplayKnockedOut(): number {
    return knockedOut;
}

/**
 * How close the current cursor is to the hit moment (0 = far, 1 = at hit).
 * Used by the camera to zoom in during the impact.
 */
export function getReplayHitProximity(): number {
    if (hitIndex < 0 || playbackFrames.length === 0) return 0;
    const idx = Math.min(cursorPos, playbackFrames.length - 1);
    const dist = Math.abs(idx - hitIndex);
    if (dist >= REPLAY_HIT_WINDOW_FRAMES) return 0;
    return 1 - dist / REPLAY_HIT_WINDOW_FRAMES;
}

/**
 * How far past the hit moment the cursor is, as a 0–1 value.
 * Returns 0 when the cursor is at or before the hit, and ramps to 1
 * over `REPLAY_HIT_WINDOW_FRAMES` after the hit. Used by the camera
 * to transition from follow-cam back to overhead after the impact.
 *
 * @returns 0 = at/before hit, 1 = far past hit.
 *
 * @example
 * ```ts
 * const pastHit = getReplayPastHit();
 * const followFactor = 1 - pastHit; // 1 = full follow, 0 = overhead
 * ```
 */
export function getReplayPastHit(): number {
    if (hitIndex < 0 || playbackFrames.length === 0) return 0;
    const idx = Math.min(cursorPos, playbackFrames.length - 1);
    const dist = idx - hitIndex; // signed: negative = before hit
    if (dist <= 0) return 0;
    if (dist >= REPLAY_HIT_WINDOW_FRAMES) return 1;
    return dist / REPLAY_HIT_WINDOW_FRAMES;
}

/**
 * Get the velocity of a player at the current replay cursor, computed
 * from position deltas between consecutive frames.
 * Returns `null` when no replay is active.
 *
 * @param playerId - Player index (0 or 1).
 * @returns `[vx, vy, vz]` velocity in units/second, or `null`.
 *
 * @example
 * ```ts
 * const vel = getReplayVelocity(0);
 * if (vel) {
 *     const speed = Math.sqrt(vel[0]**2 + vel[2]**2);
 * }
 * ```
 */
export function getReplayVelocity(
    playerId: number,
): [number, number, number] | null {
    if (!active || playbackFrames.length < 2) return null;

    const idx = Math.min(cursorPos, playbackFrames.length - 1);
    const i0 = Math.floor(idx);
    const i1 = Math.min(i0 + 1, playbackFrames.length - 1);
    if (i0 === i1) return [0, 0, 0];

    const f0 = playbackFrames[i0];
    const f1 = playbackFrames[i1];

    if (playerId === 0) {
        return [
            (f1.p0x - f0.p0x) * FIXED_HZ,
            (f1.p0y - f0.p0y) * FIXED_HZ,
            (f1.p0z - f0.p0z) * FIXED_HZ,
        ];
    }
    return [
        (f1.p1x - f0.p1x) * FIXED_HZ,
        (f1.p1y - f0.p1y) * FIXED_HZ,
        (f1.p1z - f0.p1z) * FIXED_HZ,
    ];
}

/**
 * Get the current replay playback speed as a fraction of real-time.
 * Returns 0 when no replay is active.
 *
 * @returns Speed factor (e.g. 0.4 for normal, 0.15 at hit moment).
 *
 * @example
 * ```ts
 * const speed = getReplaySpeed(); // 0.4 or 0.15
 * ```
 */
export function getReplaySpeed(): number {
    if (!active || playbackFrames.length === 0) return 0;
    const frameIdx = Math.floor(Math.min(cursorPos, playbackFrames.length - 1));
    return getSpeedAtFrame(frameIdx);
}

/**
 * Whether the current replay had a real collision hit (as opposed to a
 * self-KO where the player fell on their own).
 *
 * @returns `true` if `markHit()` was called before the replay started.
 *
 * @example
 * ```ts
 * if (!hasReplayHit()) showSelfKoText();
 * ```
 */
export function hasReplayHit(): boolean {
    return hadRealHit;
}

/** End the replay and release the playback buffer. */
export function endReplay(): void {
    active = false;
    playbackFrames = [];
    hitIndex = -1;
    hadRealHit = false;
    cursorPos = 0;
}

/**
 * Clear the recording buffer without affecting active playback.
 * Call at the start of each round so the replay only contains
 * footage from the current round.
 *
 * @example
 * ```ts
 * // In GameManagerNode when the round counter increments:
 * clearRecording();
 * ```
 */
export function clearRecording(): void {
    buffer.length = 0;
    writeCount = 0;
    lastHitWriteCount = -1;
    staged0x = staged0y = staged0z = 0;
    staged1x = staged1y = staged1z = 0;
}

/**
 * Reset all replay state (recording + playback). Exported for testing.
 */
export function resetReplay(): void {
    buffer.length = 0;
    writeCount = 0;
    lastHitWriteCount = -1;
    staged0x = staged0y = staged0z = 0;
    staged1x = staged1y = staged1z = 0;
    endReplay();
    knockedOut = -1;
    scorer = -1;
}
