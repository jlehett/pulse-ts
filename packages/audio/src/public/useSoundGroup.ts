import { useAudio } from './hooks';
import type { SoundGroup } from '../domain/services/Audio';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Options for creating a sound group via {@link useSoundGroup}. */
export interface SoundGroupOptions {
    /**
     * Initial volume `[0, 1]`.
     *
     * @default 1
     */
    volume?: number;

    /**
     * Whether the group starts muted.
     *
     * @default false
     */
    muted?: boolean;
}

/**
 * Handle for controlling a named sound group's volume and mute state.
 *
 * Sounds routed to this group (via the `group` option on {@link useSound})
 * have their gain scaled by the group's volume.
 */
export interface SoundGroupHandle {
    /** The group name. */
    readonly name: string;

    /** Current volume `[0, 1]`. */
    readonly volume: number;

    /** Whether the group is muted. */
    readonly muted: boolean;

    /**
     * Set the group volume.
     *
     * @param volume - Volume multiplier `[0, 1]`.
     */
    setVolume(volume: number): void;

    /**
     * Set the group mute state.
     *
     * @param muted - Whether the group should be muted.
     */
    setMuted(muted: boolean): void;
}

// ---------------------------------------------------------------------------
// Public hook
// ---------------------------------------------------------------------------

/**
 * Creates or accesses a named sound group for independent volume control.
 *
 * Sound groups allow categorizing sounds (e.g. SFX, music, UI) and
 * controlling their volume independently. A sound's effective gain is:
 * `sound.gain * group.volume * masterVolume`.
 *
 * Groups persist across world lifecycles because they are tied to the
 * {@link AudioService}, not the world.
 *
 * @param name - Unique group name (e.g. `'sfx'`, `'music'`).
 * @param options - Initial volume and mute state. Only applied when the
 *   group is first created; subsequent calls with the same name return the
 *   existing group.
 * @returns A {@link SoundGroupHandle} for reading and controlling the group.
 *
 * @example
 * ```ts
 * import { useSoundGroup, useSound } from '@pulse-ts/audio';
 *
 * function GameManagerNode() {
 *     const sfx = useSoundGroup('sfx', { volume: 0.8 });
 *     const music = useSoundGroup('music', { volume: 0.5 });
 *
 *     // Route sounds through a group:
 *     const beep = useSound('tone', {
 *         wave: 'sine',
 *         frequency: 880,
 *         duration: 0.1,
 *         group: 'sfx',
 *     });
 *
 *     // In a settings menu:
 *     sfx.setVolume(0.3);
 *     music.setMuted(true);
 * }
 * ```
 */
export function useSoundGroup(
    name: string,
    options?: SoundGroupOptions,
): SoundGroupHandle {
    const audio = useAudio();
    const group: SoundGroup = audio.getOrCreateGroup(name, options);

    return {
        get name() {
            return name;
        },
        get volume() {
            return group.volume;
        },
        get muted() {
            return group.muted;
        },
        setVolume(volume: number) {
            group.volume = volume;
        },
        setMuted(muted: boolean) {
            group.muted = muted;
        },
    };
}
