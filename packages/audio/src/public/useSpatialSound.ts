import { useAudio } from './hooks';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Distance rolloff model for spatial attenuation. */
export type RolloffModel = 'linear' | 'inverse' | 'exponential';

/**
 * Options for a spatial `'tone'` sound — a positioned oscillator with
 * distance-based attenuation via a Web Audio
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/PannerNode | PannerNode}.
 */
export interface SpatialToneOptions {
    /**
     * Oscillator waveform type.
     *
     * @default 'sine'
     */
    wave?: OscillatorType;

    /** Oscillator frequency in Hz. */
    frequency: number;

    /**
     * Whether the sound loops continuously until
     * {@link SpatialSoundHandle.stop | stop()} is called.
     *
     * @default false
     */
    loop?: boolean;

    /**
     * Sound duration in seconds. Only used when `loop` is `false`.
     *
     * @default 0.5
     */
    duration?: number;

    /**
     * Gain level `[0, 1]`.
     *
     * @default 0.1
     */
    gain?: number;

    /**
     * Distance attenuation model.
     *
     * @default 'inverse'
     */
    rolloff?: RolloffModel;

    /**
     * Reference distance at which volume starts attenuating. Below this
     * distance the sound plays at full gain.
     *
     * @default 1
     */
    refDistance?: number;

    /**
     * Maximum audible distance. For `'linear'` rolloff the sound is silent
     * beyond this range; for other models it approaches minimum volume.
     *
     * @default 50
     */
    maxDistance?: number;
}

/** Map from spatial sound type string to its options interface. */
export interface SpatialSoundTypeMap {
    tone: SpatialToneOptions;
}

/** The spatial sound types supported by {@link useSpatialSound}. */
export type SpatialSoundType = keyof SpatialSoundTypeMap;

/**
 * Handle returned by {@link useSpatialSound}.
 *
 * Call {@link SpatialSoundHandle.setPosition | setPosition()} each frame to
 * place the sound source in 3D space. Volume attenuates based on distance from
 * the listener (set via
 * {@link AudioService.setListenerPosition | AudioService.setListenerPosition()}).
 */
export interface SpatialSoundHandle {
    /** Start playback. For looping sounds, runs until {@link stop} is called. */
    play(): void;

    /** Stop a looping sound or cancel an in-flight one-shot. */
    stop(): void;

    /**
     * Update the 3D position of the sound source.
     *
     * @param x - X position.
     * @param y - Y position.
     * @param z - Z position.
     */
    setPosition(x: number, y: number, z: number): void;

    /** Whether the sound is currently playing. */
    readonly playing: boolean;
}

// ---------------------------------------------------------------------------
// Public hook
// ---------------------------------------------------------------------------

/**
 * Declares a 3D positional sound that attenuates with distance from the
 * listener using a Web Audio
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/PannerNode | PannerNode}.
 *
 * Use {@link SpatialSoundHandle.setPosition | setPosition()} to place the
 * source in world space, and
 * {@link AudioService.setListenerPosition | AudioService.setListenerPosition()}
 * to sync the listener to the camera or player position.
 *
 * @typeParam T - The sound type (currently `'tone'`).
 * @param type - The kind of sound to synthesize.
 * @param options - Configuration for the chosen sound type.
 * @returns A {@link SpatialSoundHandle} for controlling playback and position.
 *
 * @example
 * ```ts
 * import { useFrameUpdate, useComponent, Transform } from '@pulse-ts/core';
 * import { useSpatialSound } from '@pulse-ts/audio';
 *
 * function EngineNode() {
 *     const transform = useComponent(Transform);
 *     const engineSfx = useSpatialSound('tone', {
 *         wave: 'sawtooth',
 *         frequency: 120,
 *         loop: true,
 *         gain: 0.3,
 *         rolloff: 'inverse',
 *         maxDistance: 50,
 *     });
 *
 *     engineSfx.play();
 *
 *     useFrameUpdate(() => {
 *         const p = transform.localPosition;
 *         engineSfx.setPosition(p.x, p.y, p.z);
 *     });
 * }
 * ```
 */
export function useSpatialSound<T extends SpatialSoundType>(
    type: T,
    options: Readonly<SpatialSoundTypeMap[T]>,
): SpatialSoundHandle {
    const audio = useAudio();
    const opts = options as SpatialToneOptions;

    // Deferred position — applied to PannerNode when created
    let posX = 0;
    let posY = 0;
    let posZ = 0;

    // Lazily created audio nodes
    let panner: PannerNode | null = null;
    let osc: OscillatorNode | null = null;
    let isPlaying = false;

    /** Create the PannerNode once and connect it to the master destination. */
    function ensurePanner(): PannerNode {
        if (!panner) {
            const ctx = audio.ensureContext();
            panner = ctx.createPanner();
            panner.distanceModel = opts.rolloff ?? 'inverse';
            panner.refDistance = opts.refDistance ?? 1;
            panner.maxDistance = opts.maxDistance ?? 50;
            panner.positionX.value = posX;
            panner.positionY.value = posY;
            panner.positionZ.value = posZ;
            panner.connect(audio.destination);
        }
        return panner;
    }

    return {
        play() {
            // Looping sounds: no-op if already playing
            if (isPlaying && opts.loop) return;

            const p = ensurePanner();
            const ctx = audio.ensureContext();
            const now = ctx.currentTime;
            const gain = opts.gain ?? 0.1;

            switch (type) {
                case 'tone': {
                    const newOsc = ctx.createOscillator();
                    newOsc.type = opts.wave ?? 'sine';
                    newOsc.frequency.setValueAtTime(opts.frequency, now);

                    const gainNode = ctx.createGain();
                    gainNode.gain.setValueAtTime(gain, now);

                    if (opts.loop) {
                        newOsc.connect(gainNode).connect(p);
                        newOsc.start();
                        osc = newOsc;
                        isPlaying = true;
                    } else {
                        const dur = opts.duration ?? 0.5;
                        gainNode.gain.linearRampToValueAtTime(0, now + dur);
                        newOsc.connect(gainNode).connect(p);
                        newOsc.start(now);
                        newOsc.stop(now + dur);
                    }
                    break;
                }
            }
        },

        stop() {
            if (!osc) return;
            osc.stop();
            osc.disconnect();
            osc = null;
            isPlaying = false;
        },

        setPosition(x: number, y: number, z: number) {
            posX = x;
            posY = y;
            posZ = z;
            if (panner) {
                panner.positionX.value = x;
                panner.positionY.value = y;
                panner.positionZ.value = z;
            }
        },

        get playing() {
            return isPlaying;
        },
    };
}
