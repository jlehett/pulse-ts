import { Service } from '@pulse-ts/core';

/** Options for creating an {@link AudioService}. */
export interface AudioOptions {
    /**
     * Master volume multiplier `[0, 1]`.
     *
     * @default 1
     */
    masterVolume?: number;
}

/**
 * Manages the Web Audio `AudioContext` lifecycle and provides a master gain
 * node that all sounds route through.
 *
 * The `AudioContext` is created lazily on the first call to
 * {@link AudioService.ensureContext | ensureContext()}, which always follows a
 * user gesture, satisfying browser autoplay policy automatically. If the
 * context is in a `'suspended'` state it is automatically resumed.
 *
 * @example
 * ```ts
 * import { World } from '@pulse-ts/core';
 * import { AudioService } from '@pulse-ts/audio';
 *
 * const world = new World();
 * const audio = world.provideService(new AudioService({ masterVolume: 0.8 }));
 *
 * // Later (after user interaction):
 * const ctx = audio.ensureContext();
 * ```
 */
export class AudioService extends Service {
    private _ctx: AudioContext | null = null;
    private _masterGain: GainNode | null = null;
    private _masterVolume: number;

    constructor(options: AudioOptions = {}) {
        super();
        this._masterVolume = options.masterVolume ?? 1;
    }

    /**
     * Returns the `AudioContext`, creating it on first call. If the context is
     * suspended (e.g. due to autoplay policy) it is automatically resumed.
     *
     * @returns The shared `AudioContext`.
     */
    ensureContext(): AudioContext {
        if (!this._ctx) {
            this._ctx = new AudioContext();
            this._masterGain = this._ctx.createGain();
            this._masterGain.gain.value = this._masterVolume;
            this._masterGain.connect(this._ctx.destination);
        }
        if (this._ctx.state === 'suspended') {
            this._ctx.resume();
        }
        return this._ctx;
    }

    /**
     * The audio destination that all sounds should connect to. Routes through
     * the master gain node so that {@link masterVolume} is applied globally.
     *
     * Calling this ensures the `AudioContext` exists.
     *
     * @returns The master `GainNode`.
     */
    get destination(): GainNode {
        this.ensureContext();
        return this._masterGain!;
    }

    /**
     * The current master volume `[0, 1]`.
     */
    get masterVolume(): number {
        return this._masterVolume;
    }

    /**
     * Sets the master volume. Takes effect immediately if the context is
     * already created.
     *
     * @param value - Volume multiplier `[0, 1]`.
     */
    set masterVolume(value: number) {
        this._masterVolume = value;
        if (this._masterGain) {
            this._masterGain.gain.value = value;
        }
    }

    /**
     * Sets the 3D position of the audio listener (typically synced to the
     * camera or player position each frame).
     *
     * Has no effect if the `AudioContext` has not been created yet (i.e.
     * before the first sound is played or {@link ensureContext} is called).
     * The listener defaults to the origin `(0, 0, 0)`.
     *
     * @param x - X position.
     * @param y - Y position.
     * @param z - Z position.
     *
     * @example
     * ```ts
     * import { useFrameUpdate } from '@pulse-ts/core';
     * import { useAudio } from '@pulse-ts/audio';
     *
     * function CameraListenerNode() {
     *     const audio = useAudio();
     *     useFrameUpdate(() => {
     *         audio.setListenerPosition(cam.position.x, cam.position.y, cam.position.z);
     *     });
     * }
     * ```
     */
    setListenerPosition(x: number, y: number, z: number): void {
        if (!this._ctx) return;
        const l = this._ctx.listener;
        l.positionX.value = x;
        l.positionY.value = y;
        l.positionZ.value = z;
    }
}
