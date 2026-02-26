/**
 * Procedural sound effects for the platformer demo.
 *
 * All sounds are synthesized via the Web Audio API — no audio assets needed.
 * Each play function creates short-lived audio graph nodes that are
 * automatically garbage-collected after playback.
 *
 * AudioContext is created lazily on the first call, which always follows user
 * input (keypress), satisfying browser autoplay policy.
 */

// ---------------------------------------------------------------------------
// Configuration constants (exported for testability)
// ---------------------------------------------------------------------------

/** Jump sound: rising square wave. */
export const JUMP_DURATION = 0.08;
export const JUMP_FREQ_START = 400;
export const JUMP_FREQ_END = 800;
export const JUMP_GAIN = 0.1;

/** Collect sound: 3-note chime arpeggio. */
export const COLLECT_DURATION = 0.2;
export const COLLECT_NOTE_INTERVAL = 0.06;
export const COLLECT_FREQUENCIES = [523.25, 659.25, 783.99]; // C5, E5, G5
export const COLLECT_GAIN = 0.1;

/** Land sound: low thud. */
export const LAND_DURATION = 0.1;
export const LAND_FREQUENCY = 80;
export const LAND_GAIN = 0.15;

/** Dash sound: filtered white noise whoosh. */
export const DASH_DURATION = 0.15;
export const DASH_FILTER_START = 2000;
export const DASH_FILTER_END = 500;
export const DASH_GAIN = 0.12;

/** Death sound: descending sawtooth. */
export const DEATH_DURATION = 0.2;
export const DEATH_FREQ_START = 600;
export const DEATH_FREQ_END = 150;
export const DEATH_GAIN = 0.12;

// ---------------------------------------------------------------------------
// Lazy AudioContext singleton
// ---------------------------------------------------------------------------

let ctx: AudioContext | null = null;

function getContext(): AudioContext {
    if (!ctx) {
        ctx = new AudioContext();
    }
    if (ctx.state === 'suspended') {
        ctx.resume();
    }
    return ctx;
}

// ---------------------------------------------------------------------------
// Play functions
// ---------------------------------------------------------------------------

/**
 * Rising square-wave tone (~80 ms).
 *
 * @example
 * ```ts
 * playJump();
 * ```
 */
export function playJump(): void {
    const ac = getContext();
    const now = ac.currentTime;

    const osc = ac.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(JUMP_FREQ_START, now);
    osc.frequency.linearRampToValueAtTime(JUMP_FREQ_END, now + JUMP_DURATION);

    const gain = ac.createGain();
    gain.gain.setValueAtTime(JUMP_GAIN, now);
    gain.gain.linearRampToValueAtTime(0, now + JUMP_DURATION);

    osc.connect(gain).connect(ac.destination);
    osc.start(now);
    osc.stop(now + JUMP_DURATION);
}

/**
 * Three-note sine chime arpeggio (C5-E5-G5, ~200 ms).
 *
 * @example
 * ```ts
 * playCollect();
 * ```
 */
export function playCollect(): void {
    const ac = getContext();
    const now = ac.currentTime;

    for (let i = 0; i < COLLECT_FREQUENCIES.length; i++) {
        const offset = i * COLLECT_NOTE_INTERVAL;
        const noteDuration = COLLECT_DURATION - offset;

        const osc = ac.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(COLLECT_FREQUENCIES[i], now + offset);

        const gain = ac.createGain();
        gain.gain.setValueAtTime(COLLECT_GAIN, now + offset);
        gain.gain.linearRampToValueAtTime(0, now + offset + noteDuration);

        osc.connect(gain).connect(ac.destination);
        osc.start(now + offset);
        osc.stop(now + offset + noteDuration);
    }
}

/**
 * Low-frequency triangle thud (~100 ms).
 *
 * @example
 * ```ts
 * playLand();
 * ```
 */
export function playLand(): void {
    const ac = getContext();
    const now = ac.currentTime;

    const osc = ac.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(LAND_FREQUENCY, now);

    const gain = ac.createGain();
    gain.gain.setValueAtTime(LAND_GAIN, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + LAND_DURATION);

    osc.connect(gain).connect(ac.destination);
    osc.start(now);
    osc.stop(now + LAND_DURATION);
}

/**
 * Filtered white-noise whoosh (~150 ms).
 *
 * @example
 * ```ts
 * playDash();
 * ```
 */
export function playDash(): void {
    const ac = getContext();
    const now = ac.currentTime;

    // Generate white noise buffer
    const bufferSize = Math.ceil(ac.sampleRate * DASH_DURATION);
    const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    const source = ac.createBufferSource();
    source.buffer = buffer;

    const filter = ac.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(DASH_FILTER_START, now);
    filter.frequency.linearRampToValueAtTime(DASH_FILTER_END, now + DASH_DURATION);
    filter.Q.setValueAtTime(1, now);

    const gain = ac.createGain();
    gain.gain.setValueAtTime(DASH_GAIN, now);
    gain.gain.linearRampToValueAtTime(0, now + DASH_DURATION);

    source.connect(filter).connect(gain).connect(ac.destination);
    source.start(now);
    source.stop(now + DASH_DURATION);
}

/**
 * Descending sawtooth tone (~200 ms).
 *
 * @example
 * ```ts
 * playDeath();
 * ```
 */
export function playDeath(): void {
    const ac = getContext();
    const now = ac.currentTime;

    const osc = ac.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(DEATH_FREQ_START, now);
    osc.frequency.linearRampToValueAtTime(DEATH_FREQ_END, now + DEATH_DURATION);

    const gain = ac.createGain();
    gain.gain.setValueAtTime(DEATH_GAIN, now);
    gain.gain.linearRampToValueAtTime(0, now + DEATH_DURATION);

    osc.connect(gain).connect(ac.destination);
    osc.start(now);
    osc.stop(now + DEATH_DURATION);
}
