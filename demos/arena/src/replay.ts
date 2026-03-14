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

/** A single recorded frame: positions of both players. */
export interface ReplayFrame {
    p0x: number;
    p0y: number;
    p0z: number;
    p1x: number;
    p1y: number;
    p1z: number;
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

    // Per-player staging
    staged0x: number;
    staged0y: number;
    staged0z: number;
    staged1x: number;
    staged1y: number;
    staged1z: number;
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
export const ReplayStore = defineStore('replay', (): ReplayState => ({
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
    staged0x: 0,
    staged0y: 0,
    staged0z: 0,
    staged1x: 0,
    staged1y: 0,
    staged1z: 0,
}));

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
    if (playerId === 0) {
        state.staged0x = x;
        state.staged0y = y;
        state.staged0z = z;
    } else {
        state.staged1x = x;
        state.staged1y = y;
        state.staged1z = z;
    }
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
        state.staged0x,
        state.staged0y,
        state.staged0z,
        state.staged1x,
        state.staged1y,
        state.staged1z,
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
        state.buffer.push({ p0x, p0y, p0z, p1x, p1y, p1z });
    } else {
        const f = state.buffer[idx];
        f.p0x = p0x;
        f.p0y = p0y;
        f.p0z = p0z;
        f.p1x = p1x;
        f.p1y = p1y;
        f.p1z = p1z;
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
            p0x: f.p0x,
            p0y: f.p0y,
            p0z: f.p0z,
            p1x: f.p1x,
            p1y: f.p1y,
            p1z: f.p1z,
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

    const f0 = state.playbackFrames[i0];
    const f1 = state.playbackFrames[i1];

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

    const f0 = state.playbackFrames[i0];
    const f1 = state.playbackFrames[i1];

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
    state.staged0x = state.staged0y = state.staged0z = 0;
    state.staged1x = state.staged1y = state.staged1z = 0;
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
    state.staged0x = state.staged0y = state.staged0z = 0;
    state.staged1x = state.staged1y = state.staged1z = 0;
    endReplay(state);
    state.knockedOut = -1;
    state.scorer = -1;
}
