import { AudioService } from '../domain/services/Audio';
import { useAudio } from './hooks';

// ---------------------------------------------------------------------------
// Option types (discriminated by sound type string)
// ---------------------------------------------------------------------------

/** Options for a `'tone'` sound — an oscillator with optional frequency ramp. */
export interface ToneOptions {
    /**
     * Oscillator waveform type.
     *
     * @default 'sine'
     */
    wave?: OscillatorType;

    /**
     * Oscillator frequency in Hz. Pass a single number for a fixed pitch, or
     * a `[start, end]` tuple for a linear ramp over the duration.
     */
    frequency: number | [number, number];

    /** Sound duration in seconds. */
    duration: number;

    /**
     * Peak gain `[0, 1]`. The gain envelope ramps linearly to 0 by the end.
     *
     * @default 0.1
     */
    gain?: number;
}

/** Options for a `'noise'` sound — filtered white noise. */
export interface NoiseOptions {
    /**
     * Biquad filter type applied to the noise.
     *
     * @default 'bandpass'
     */
    filter?: BiquadFilterType;

    /**
     * Filter frequency in Hz. Pass a single number for a fixed cutoff, or
     * a `[start, end]` tuple for a linear sweep.
     */
    frequency: number | [number, number];

    /** Sound duration in seconds. */
    duration: number;

    /**
     * Peak gain `[0, 1]`. The gain envelope ramps linearly to 0 by the end.
     *
     * @default 0.1
     */
    gain?: number;

    /**
     * Filter Q (quality) factor.
     *
     * @default 1
     */
    q?: number;
}

/** Options for an `'arpeggio'` sound — a multi-note oscillator sequence. */
export interface ArpeggioOptions {
    /**
     * Oscillator waveform type.
     *
     * @default 'sine'
     */
    wave?: OscillatorType;

    /** Array of note frequencies in Hz, played sequentially. */
    notes: number[];

    /** Time between each note onset in seconds. */
    interval: number;

    /** Total sound duration in seconds. */
    duration: number;

    /**
     * Peak gain per note `[0, 1]`. Each note's gain ramps to 0 over its
     * remaining duration.
     *
     * @default 0.1
     */
    gain?: number;
}

/** Map from sound type string to its options interface. */
export interface SoundTypeMap {
    tone: ToneOptions;
    noise: NoiseOptions;
    arpeggio: ArpeggioOptions;
}

/** The sound types supported by {@link useSound}. */
export type SoundType = keyof SoundTypeMap;

/** Handle returned by {@link useSound}. */
export interface SoundHandle {
    /** Triggers playback. Fire-and-forget — audio nodes self-clean after playback. */
    play(): void;
}

// ---------------------------------------------------------------------------
// Internal play helpers
// ---------------------------------------------------------------------------

function playTone(audio: AudioService, opts: ToneOptions): void {
    const ctx = audio.ensureContext();
    const dest = audio.destination;
    const now = ctx.currentTime;
    const gain = opts.gain ?? 0.1;

    const osc = ctx.createOscillator();
    osc.type = opts.wave ?? 'sine';

    if (Array.isArray(opts.frequency)) {
        osc.frequency.setValueAtTime(opts.frequency[0], now);
        osc.frequency.linearRampToValueAtTime(
            opts.frequency[1],
            now + opts.duration,
        );
    } else {
        osc.frequency.setValueAtTime(opts.frequency, now);
    }

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(gain, now);
    gainNode.gain.linearRampToValueAtTime(0, now + opts.duration);

    osc.connect(gainNode).connect(dest);
    osc.start(now);
    osc.stop(now + opts.duration);
}

function playNoise(audio: AudioService, opts: NoiseOptions): void {
    const ctx = audio.ensureContext();
    const dest = audio.destination;
    const now = ctx.currentTime;
    const gain = opts.gain ?? 0.1;

    // Generate white noise buffer
    const bufferSize = Math.ceil(ctx.sampleRate * opts.duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = opts.filter ?? 'bandpass';
    if (Array.isArray(opts.frequency)) {
        filter.frequency.setValueAtTime(opts.frequency[0], now);
        filter.frequency.linearRampToValueAtTime(
            opts.frequency[1],
            now + opts.duration,
        );
    } else {
        filter.frequency.setValueAtTime(opts.frequency, now);
    }
    filter.Q.setValueAtTime(opts.q ?? 1, now);

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(gain, now);
    gainNode.gain.linearRampToValueAtTime(0, now + opts.duration);

    source.connect(filter).connect(gainNode).connect(dest);
    source.start(now);
    source.stop(now + opts.duration);
}

function playArpeggio(audio: AudioService, opts: ArpeggioOptions): void {
    const ctx = audio.ensureContext();
    const dest = audio.destination;
    const now = ctx.currentTime;
    const gain = opts.gain ?? 0.1;

    for (let i = 0; i < opts.notes.length; i++) {
        const offset = i * opts.interval;
        const noteDuration = opts.duration - offset;
        if (noteDuration <= 0) break;

        const osc = ctx.createOscillator();
        osc.type = opts.wave ?? 'sine';
        osc.frequency.setValueAtTime(opts.notes[i], now + offset);

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(gain, now + offset);
        gainNode.gain.linearRampToValueAtTime(0, now + offset + noteDuration);

        osc.connect(gainNode).connect(dest);
        osc.start(now + offset);
        osc.stop(now + offset + noteDuration);
    }
}

// ---------------------------------------------------------------------------
// Public hook
// ---------------------------------------------------------------------------

/**
 * Declares a procedural sound effect that can be triggered with `.play()`.
 *
 * Supports three sound types:
 * - `'tone'` — oscillator with optional frequency ramp (e.g. jump, death)
 * - `'noise'` — filtered white noise (e.g. dash whoosh)
 * - `'arpeggio'` — multi-note oscillator sequence (e.g. collect chime)
 *
 * The `AudioContext` is created lazily on the first `.play()` call, which
 * satisfies browser autoplay policy automatically.
 *
 * @typeParam T - The sound type (`'tone'`, `'noise'`, or `'arpeggio'`).
 * @param type - The kind of sound to synthesize.
 * @param options - Configuration for the chosen sound type.
 * @returns A {@link SoundHandle} with a `.play()` method.
 *
 * @example
 * ```ts
 * import { useSound } from '@pulse-ts/audio';
 *
 * function PlayerNode() {
 *     const jumpSfx = useSound('tone', {
 *         wave: 'square',
 *         frequency: [400, 800],
 *         duration: 0.08,
 *         gain: 0.1,
 *     });
 *
 *     const dashSfx = useSound('noise', {
 *         filter: 'bandpass',
 *         frequency: [2000, 500],
 *         duration: 0.15,
 *         gain: 0.12,
 *     });
 *
 *     const collectSfx = useSound('arpeggio', {
 *         wave: 'sine',
 *         notes: [523.25, 659.25, 783.99],
 *         interval: 0.06,
 *         duration: 0.2,
 *         gain: 0.1,
 *     });
 *
 *     // Later, in an event handler or update loop:
 *     jumpSfx.play();
 * }
 * ```
 */
export function useSound<T extends SoundType>(
    type: T,
    options: SoundTypeMap[T],
): SoundHandle {
    const audio = useAudio();

    return {
        play() {
            switch (type) {
                case 'tone':
                    playTone(audio, options as ToneOptions);
                    break;
                case 'noise':
                    playNoise(audio, options as NoiseOptions);
                    break;
                case 'arpeggio':
                    playArpeggio(audio, options as ArpeggioOptions);
                    break;
            }
        },
    };
}
