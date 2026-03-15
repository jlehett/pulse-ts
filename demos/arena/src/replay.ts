import { defineStore } from '@pulse-ts/core';
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

/** A single recorded frame: positions of both players, indexed by player ID. */
export interface ReplayFrame {
    positions: [number, number, number][];
}

/** Internal state for the replay system. */
export interface ReplayState {
    // Ring buffer
    buffer: ReplayFrame[];
    writeCount: number;
    hitWriteCounts: number[];

    // Playback
    active: boolean;
    playbackFrames: ReplayFrame[];
    hitIndices: number[];
    hadRealHit: boolean;
    cursorPos: number;
    knockedOut: number;
    scorer: number;

    // Per-player staging, indexed by player ID
    staged: [number, number, number][];
}

/**
 * Store definition for replay recording and playback state.
 *
 * @example
 * ```ts
 * import { useStore } from '@pulse-ts/core';
 * import { ReplayStore, commitFrame, startReplay } from '../replay';
 *
 * const [replay] = useStore(ReplayStore);
 * commitFrame(replay);
 * ```
 */
export const ReplayStore = defineStore(
    'replay',
    (): ReplayState => ({
        buffer: [],
        writeCount: 0,
        hitWriteCounts: [],
        active: false,
        playbackFrames: [],
        hitIndices: [],
        hadRealHit: false,
        cursorPos: 0,
        knockedOut: -1,
        scorer: -1,
        staged: [
            [0, 0, 0],
            [0, 0, 0],
        ],
    }),
);

// ---------------------------------------------------------------------------
// Recording API
// ---------------------------------------------------------------------------

/**
 * Stage a player's position for the current fixed step.
 * Call from each player node's `useFixedUpdate`. After both players have
 * staged, call {@link commitFrame} (typically from `useFixedLate`).
 *
 * @param state - The replay state from the store.
 * @param playerId - Player index (0 or 1).
 * @param x - World X position.
 * @param y - World Y position.
 * @param z - World Z position.
 *
 * @example
 * ```ts
 * stagePlayerPosition(replay, 0, transform.localPosition.x, ...);
 * ```
 */
export function stagePlayerPosition(
    state: ReplayState,
    playerId: number,
    x: number,
    y: number,
    z: number,
): void {
    state.staged[playerId][0] = x;
    state.staged[playerId][1] = y;
    state.staged[playerId][2] = z;
}

/**
 * Commit the staged positions into the ring buffer as one frame.
 * Call once per fixed step after all players have staged their positions.
 *
 * @param state - The replay state from the store.
 *
 * @example
 * ```ts
 * useFixedLate(() => { commitFrame(replay); });
 * ```
 */
export function commitFrame(state: ReplayState): void {
    recordFrame(
        state,
        state.staged[0][0],
        state.staged[0][1],
        state.staged[0][2],
        state.staged[1][0],
        state.staged[1][1],
        state.staged[1][2],
    );
}

/**
 * Record both players' positions for one fixed step.
 *
 * @param state - The replay state from the store.
 * @param p0x - Player 0 X position.
 * @param p0y - Player 0 Y position.
 * @param p0z - Player 0 Z position.
 * @param p1x - Player 1 X position.
 * @param p1y - Player 1 Y position.
 * @param p1z - Player 1 Z position.
 *
 * @example
 * ```ts
 * recordFrame(replay, p0.x, p0.y, p0.z, p1.x, p1.y, p1.z);
 * ```
 */
export function recordFrame(
    state: ReplayState,
    p0x: number,
    p0y: number,
    p0z: number,
    p1x: number,
    p1y: number,
    p1z: number,
): void {
    const idx = state.writeCount % BUFFER_SIZE;
    if (state.buffer.length <= idx) {
        state.buffer.push({
            positions: [
                [p0x, p0y, p0z],
                [p1x, p1y, p1z],
            ],
        });
    } else {
        const f = state.buffer[idx];
        f.positions[0][0] = p0x;
        f.positions[0][1] = p0y;
        f.positions[0][2] = p0z;
        f.positions[1][0] = p1x;
        f.positions[1][1] = p1y;
        f.positions[1][2] = p1z;
    }
    state.writeCount++;
}

/**
 * Mark the current frame as a collision hit moment.
 *
 * @param state - The replay state from the store.
 *
 * @example
 * ```ts
 * useOnCollisionStart(() => { markHit(replay); });
 * ```
 */
export function markHit(state: ReplayState): void {
    state.hitWriteCounts.push(state.writeCount);
}

// ---------------------------------------------------------------------------
// Playback API
// ---------------------------------------------------------------------------

/**
 * Compute the playback speed at a given frame index.
 *
 * @param hitIndices - Array of hit frame indices.
 * @param frameIndex - Index into the playback frames array.
 * @returns Playback speed as a fraction of real-time.
 *
 * @example
 * ```ts
 * getSpeedAtFrame(replay.hitIndices, hitIndex); // REPLAY_HIT_SPEED (0.15)
 * ```
 */
export function getSpeedAtFrame(
    hitIndices: number[],
    frameIndex: number,
): number {
    if (hitIndices.length === 0) return REPLAY_NORMAL_SPEED;
    let minDist = Infinity;
    for (const hi of hitIndices) {
        minDist = Math.min(minDist, Math.abs(frameIndex - hi));
    }
    if (minDist >= REPLAY_HIT_WINDOW_FRAMES) return REPLAY_NORMAL_SPEED;
    const t = minDist / REPLAY_HIT_WINDOW_FRAMES;
    return REPLAY_HIT_SPEED + (REPLAY_NORMAL_SPEED - REPLAY_HIT_SPEED) * t;
}

/**
 * Snapshot the ring buffer and begin replay playback.
 *
 * @param state - The replay state from the store.
 * @param knockedOutPlayerId - ID of the player that was knocked out.
 *
 * @example
 * ```ts
 * startReplay(replay, 1);
 * ```
 */
export function startReplay(
    state: ReplayState,
    knockedOutPlayerId: number,
): void {
    state.knockedOut = knockedOutPlayerId;
    state.scorer = 1 - knockedOutPlayerId;

    const frameCount = Math.min(state.writeCount, BUFFER_SIZE);
    state.playbackFrames = [];
    const startWrite = state.writeCount - frameCount;
    for (let i = 0; i < frameCount; i++) {
        const bufIdx = (startWrite + i) % BUFFER_SIZE;
        const f = state.buffer[bufIdx];
        state.playbackFrames.push({
            positions: [
                [f.positions[0][0], f.positions[0][1], f.positions[0][2]],
                [f.positions[1][0], f.positions[1][1], f.positions[1][2]],
            ],
        });
    }

    state.hitIndices = [];
    for (const hwc of state.hitWriteCounts) {
        if (hwc >= startWrite && hwc < state.writeCount) {
            state.hitIndices.push(hwc - startWrite);
        }
    }
    state.hadRealHit = state.hitIndices.length > 0;

    state.cursorPos = 0;
    state.active = true;
}

/**
 * Advance the replay cursor by one frame's worth of real time.
 * Returns `true` while the replay is still playing, `false` when finished.
 *
 * @param state - The replay state from the store.
 * @param dt - Real-time delta in seconds.
 * @returns Whether the replay is still active.
 *
 * @example
 * ```ts
 * if (!advanceReplay(replay, dt)) { /* replay done *\/ }
 * ```
 */
export function advanceReplay(state: ReplayState, dt: number): boolean {
    if (!state.active || state.playbackFrames.length === 0) return false;

    const frameIdx = Math.floor(
        Math.min(state.cursorPos, state.playbackFrames.length - 1),
    );
    const speed = getSpeedAtFrame(state.hitIndices, frameIdx);

    state.cursorPos += dt * speed * FIXED_HZ;

    if (state.cursorPos >= state.playbackFrames.length - 1) {
        state.active = false;
        return false;
    }
    return true;
}

/**
 * Get the interpolated position of a player at the current replay cursor.
 * Returns `null` when no replay is active.
 *
 * @param state - The replay state from the store.
 * @param playerId - Player index (0 or 1).
 * @returns `[x, y, z]` position tuple, or `null` if replay is inactive.
 *
 * @example
 * ```ts
 * const pos = getReplayPosition(replay, 0);
 * if (pos) mesh.position.set(...pos);
 * ```
 */
export function getReplayPosition(
    state: ReplayState,
    playerId: number,
): [number, number, number] | null {
    if (!state.active || state.playbackFrames.length === 0) return null;

    const idx = Math.min(state.cursorPos, state.playbackFrames.length - 1);
    const i0 = Math.floor(idx);
    const i1 = Math.min(i0 + 1, state.playbackFrames.length - 1);
    const t = idx - i0;

    const pos0 = state.playbackFrames[i0].positions[playerId];
    const pos1 = state.playbackFrames[i1].positions[playerId];

    return [
        pos0[0] + (pos1[0] - pos0[0]) * t,
        pos0[1] + (pos1[1] - pos0[1]) * t,
        pos0[2] + (pos1[2] - pos0[2]) * t,
    ];
}

/** Whether a replay is currently active.
 * @param state - The replay state from the store.
 */
export function isReplayActive(state: ReplayState): boolean {
    return state.active;
}

/** The player ID of the scorer (winner) in the current/last replay.
 * @param state - The replay state from the store.
 */
export function getReplayScorer(state: ReplayState): number {
    return state.scorer;
}

/** The player ID that was knocked out in the current/last replay.
 * @param state - The replay state from the store.
 */
export function getReplayKnockedOut(state: ReplayState): number {
    return state.knockedOut;
}

/**
 * How close the current cursor is to the hit moment (0 = far, 1 = at hit).
 *
 * @param state - The replay state from the store.
 */
export function getReplayHitProximity(state: ReplayState): number {
    if (state.hitIndices.length === 0 || state.playbackFrames.length === 0)
        return 0;
    const idx = Math.min(state.cursorPos, state.playbackFrames.length - 1);
    let minDist = Infinity;
    for (const hi of state.hitIndices) {
        minDist = Math.min(minDist, Math.abs(idx - hi));
    }
    if (minDist >= REPLAY_HIT_WINDOW_FRAMES) return 0;
    return 1 - minDist / REPLAY_HIT_WINDOW_FRAMES;
}

/**
 * How far past the hit moment the cursor is, as a 0-1 value.
 *
 * @param state - The replay state from the store.
 * @returns 0 = at/before hit, 1 = far past hit.
 */
export function getReplayPastHit(state: ReplayState): number {
    if (state.hitIndices.length === 0 || state.playbackFrames.length === 0)
        return 0;
    const lastHit = state.hitIndices[state.hitIndices.length - 1];
    const idx = Math.min(state.cursorPos, state.playbackFrames.length - 1);
    const dist = idx - lastHit;
    if (dist <= 0) return 0;
    if (dist >= REPLAY_HIT_WINDOW_FRAMES) return 1;
    return dist / REPLAY_HIT_WINDOW_FRAMES;
}

/**
 * Get the velocity of a player at the current replay cursor.
 *
 * @param state - The replay state from the store.
 * @param playerId - Player index (0 or 1).
 * @returns `[vx, vy, vz]` velocity in units/second, or `null`.
 */
export function getReplayVelocity(
    state: ReplayState,
    playerId: number,
): [number, number, number] | null {
    if (!state.active || state.playbackFrames.length < 2) return null;

    const idx = Math.min(state.cursorPos, state.playbackFrames.length - 1);
    const i0 = Math.floor(idx);
    const i1 = Math.min(i0 + 1, state.playbackFrames.length - 1);
    if (i0 === i1) return [0, 0, 0];

    const pos0 = state.playbackFrames[i0].positions[playerId];
    const pos1 = state.playbackFrames[i1].positions[playerId];

    return [
        (pos1[0] - pos0[0]) * FIXED_HZ,
        (pos1[1] - pos0[1]) * FIXED_HZ,
        (pos1[2] - pos0[2]) * FIXED_HZ,
    ];
}

/**
 * Get the current replay playback speed as a fraction of real-time.
 *
 * @param state - The replay state from the store.
 * @returns Speed factor (e.g. 0.4 for normal, 0.15 at hit moment).
 */
export function getReplaySpeed(state: ReplayState): number {
    if (!state.active || state.playbackFrames.length === 0) return 0;
    const frameIdx = Math.floor(
        Math.min(state.cursorPos, state.playbackFrames.length - 1),
    );
    return getSpeedAtFrame(state.hitIndices, frameIdx);
}

/**
 * Whether the current replay had a real collision hit.
 *
 * @param state - The replay state from the store.
 */
export function hasReplayHit(state: ReplayState): boolean {
    return state.hadRealHit;
}

/**
 * Get the frame indices of all recorded collision hits in the current replay.
 *
 * @param state - The replay state from the store.
 */
export function getReplayHitIndices(state: ReplayState): readonly number[] {
    return state.hitIndices;
}

/**
 * Get the current replay cursor position (floating-point frame index).
 *
 * @param state - The replay state from the store.
 */
export function getReplayCursorPos(state: ReplayState): number {
    return state.cursorPos;
}

/** End the replay and release the playback buffer.
 * @param state - The replay state from the store.
 */
export function endReplay(state: ReplayState): void {
    state.active = false;
    state.playbackFrames = [];
    state.hitIndices = [];
    state.hadRealHit = false;
    state.cursorPos = 0;
}

/**
 * Clear the recording buffer without affecting active playback.
 *
 * @param state - The replay state from the store.
 */
export function clearRecording(state: ReplayState): void {
    state.buffer.length = 0;
    state.writeCount = 0;
    state.hitWriteCounts = [];
    state.staged = [
        [0, 0, 0],
        [0, 0, 0],
    ];
}

/**
 * Reset all replay state (recording + playback).
 *
 * @param state - The replay state from the store.
 */
export function resetReplay(state: ReplayState): void {
    state.buffer.length = 0;
    state.writeCount = 0;
    state.hitWriteCounts = [];
    state.staged = [
        [0, 0, 0],
        [0, 0, 0],
    ];
    endReplay(state);
    state.knockedOut = -1;
    state.scorer = -1;
}
