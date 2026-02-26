import { useFrameUpdate } from '@pulse-ts/core';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Supported wave shapes for oscillation mode. */
export type WaveType = 'sine' | 'triangle' | 'square' | 'sawtooth';

/** Built-in easing presets for tween mode. */
export type EasingPreset = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';

/** Easing specification — a preset name or a custom `(t: number) => number`. */
export type EasingOption = EasingPreset | ((t: number) => number);

/**
 * Oscillation mode with centered amplitude.
 *
 * Produces values in `[-amplitude, +amplitude]`.
 */
export interface OscillateAmplitudeOptions {
    /** Wave shape. */
    wave: WaveType;
    /** Peak deviation from zero. */
    amplitude: number;
    /** Angular frequency (ω). One full cycle every `2π / frequency` seconds. */
    frequency: number;
}

/**
 * Oscillation mode with explicit min/max range.
 *
 * Produces values in `[min, max]`.
 */
export interface OscillateRangeOptions {
    /** Wave shape. */
    wave: WaveType;
    /** Minimum output value. */
    min: number;
    /** Maximum output value. */
    max: number;
    /** Angular frequency (ω). One full cycle every `2π / frequency` seconds. */
    frequency: number;
}

/**
 * Rate mode — linearly increasing value.
 *
 * `value` equals `rate × elapsed` and grows without bound.
 */
export interface RateOptions {
    /** Units per second. */
    rate: number;
}

/**
 * One-shot tween from `from` to `to` over `duration` seconds.
 *
 * Must call {@link AnimatedValue.play} to start. Value holds at `from`
 * until played, then interpolates to `to`, then holds at `to`.
 */
export interface TweenOptions {
    /** Start value. */
    from: number;
    /** End value. */
    to: number;
    /** Duration in seconds. */
    duration: number;
    /** Easing curve. Default: `'linear'`. */
    easing?: EasingOption;
}

/** Union of all supported animate option shapes. */
export type AnimateOptions =
    | OscillateAmplitudeOptions
    | OscillateRangeOptions
    | RateOptions
    | TweenOptions;

/**
 * Handle returned by {@link useAnimate}.
 *
 * Read `.value` each frame to get the current animated number.
 * For tween mode, use `play()`, `reset()`, and `finished`.
 * For oscillation/rate modes, `play()` is a no-op, `reset()` resets
 * elapsed time to zero, and `finished` is always `false`.
 */
export interface AnimatedValue {
    /** Current animated value (auto-updated each frame). */
    readonly value: number;
    /** Start or restart the animation (tween mode only). */
    play(): void;
    /** Reset elapsed time to zero / tween to initial state. */
    reset(): void;
    /** Whether the tween has completed. Always `false` for oscillation/rate. */
    readonly finished: boolean;
}

// ---------------------------------------------------------------------------
// Easing functions
// ---------------------------------------------------------------------------

const EASING_MAP: Record<EasingPreset, (t: number) => number> = {
    linear: (t) => t,
    'ease-in': (t) => t * t,
    'ease-out': (t) => t * (2 - t),
    'ease-in-out': (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
};

function resolveEasing(option?: EasingOption): (t: number) => number {
    if (!option) return EASING_MAP.linear;
    if (typeof option === 'function') return option;
    return EASING_MAP[option];
}

// ---------------------------------------------------------------------------
// Wave functions — all map angular phase → [-1, 1]
// ---------------------------------------------------------------------------

function sineWave(phase: number): number {
    return Math.sin(phase);
}

function triangleWave(phase: number): number {
    const t = ((phase / (2 * Math.PI) % 1) + 1) % 1;
    if (t < 0.25) return 4 * t;
    if (t < 0.75) return 2 - 4 * t;
    return 4 * t - 4;
}

function squareWave(phase: number): number {
    const t = ((phase / (2 * Math.PI) % 1) + 1) % 1;
    return t < 0.5 ? 1 : -1;
}

function sawtoothWave(phase: number): number {
    const t = ((phase / (2 * Math.PI) % 1) + 1) % 1;
    return 2 * t - 1;
}

const WAVE_MAP: Record<WaveType, (phase: number) => number> = {
    sine: sineWave,
    triangle: triangleWave,
    square: squareWave,
    sawtooth: sawtoothWave,
};

// ---------------------------------------------------------------------------
// Mode detection helpers
// ---------------------------------------------------------------------------

function isRate(o: AnimateOptions): o is RateOptions {
    return 'rate' in o;
}

function isTween(o: AnimateOptions): o is TweenOptions {
    return 'from' in o && 'to' in o && 'duration' in o;
}

function isOscillateRange(o: AnimateOptions): o is OscillateRangeOptions {
    return 'wave' in o && 'min' in o && 'max' in o;
}

// Remaining case: OscillateAmplitudeOptions (wave + amplitude + frequency)

// ---------------------------------------------------------------------------
// useAnimate
// ---------------------------------------------------------------------------

/**
 * General-purpose time-varying value source.
 *
 * Supports three modes selected by the shape of `options`:
 *
 * **Oscillation** — wave shape + amplitude or min/max range:
 * ```ts
 * const bob = useAnimate({ wave: 'sine', amplitude: 0.2, frequency: 2 });
 * const pulse = useAnimate({ wave: 'sine', min: 0.3, max: 0.9, frequency: 3 });
 * ```
 *
 * **Rate** — linearly increasing value:
 * ```ts
 * const spin = useAnimate({ rate: 2 }); // 2 units/sec
 * ```
 *
 * **Tween** — one-shot interpolation with easing:
 * ```ts
 * const fade = useAnimate({ from: 0, to: 1, duration: 0.5, easing: 'ease-out' });
 * fade.play();
 * ```
 *
 * @param options - Animation configuration (mode is inferred from the fields present).
 * @returns An {@link AnimatedValue} handle with a `.value` getter that auto-updates each frame.
 *
 * @example
 * ```ts
 * import { useFrameUpdate } from '@pulse-ts/core';
 * import { useAnimate } from '@pulse-ts/effects';
 *
 * function BobNode() {
 *     const bob = useAnimate({ wave: 'sine', amplitude: 0.2, frequency: 2 });
 *     const spin = useAnimate({ rate: 1.5 });
 *
 *     useFrameUpdate(() => {
 *         root.position.y = baseY + bob.value;
 *         mesh.rotation.y = spin.value;
 *     });
 * }
 * ```
 */
export function useAnimate(options: Readonly<AnimateOptions>): AnimatedValue {
    // Shared mutable state captured by the frame callback
    let elapsed = 0;
    let currentValue = 0;

    if (isRate(options)) {
        // Rate mode: value = rate × elapsed
        currentValue = 0;

        useFrameUpdate((dt) => {
            elapsed += dt;
            currentValue = options.rate * elapsed;
        });

        return {
            get value() { return currentValue; },
            play() { /* no-op */ },
            reset() { elapsed = 0; currentValue = 0; },
            get finished() { return false; },
        };
    }

    if (isTween(options)) {
        // Tween mode: interpolate from→to over duration with easing
        const ease = resolveEasing(options.easing);
        let playing = false;
        let done = false;
        currentValue = options.from;

        useFrameUpdate((dt) => {
            if (!playing || done) return;
            elapsed += dt;
            const raw = Math.min(elapsed / options.duration, 1);
            currentValue = options.from + (options.to - options.from) * ease(raw);
            if (raw >= 1) done = true;
        });

        return {
            get value() { return currentValue; },
            play() { playing = true; done = false; },
            reset() { elapsed = 0; currentValue = options.from; playing = false; done = false; },
            get finished() { return done; },
        };
    }

    if (isOscillateRange(options)) {
        // Oscillation with min/max range
        const waveFn = WAVE_MAP[options.wave];
        const { min, max, frequency } = options;
        currentValue = min;

        useFrameUpdate((dt) => {
            elapsed += dt;
            const raw = waveFn(frequency * elapsed); // [-1, 1]
            const normalized = (raw + 1) / 2; // [0, 1]
            currentValue = min + normalized * (max - min);
        });

        return {
            get value() { return currentValue; },
            play() { /* no-op */ },
            reset() { elapsed = 0; currentValue = min; },
            get finished() { return false; },
        };
    }

    // Oscillation with amplitude (centered at 0)
    const ampOptions = options as OscillateAmplitudeOptions;
    const waveFn = WAVE_MAP[ampOptions.wave];
    const { amplitude, frequency } = ampOptions;
    currentValue = 0;

    useFrameUpdate((dt) => {
        elapsed += dt;
        currentValue = waveFn(frequency * elapsed) * amplitude;
    });

    return {
        get value() { return currentValue; },
        play() { /* no-op */ },
        reset() { elapsed = 0; currentValue = 0; },
        get finished() { return false; },
    };
}
