/**
 * Shared sound effect configurations used across player nodes and replay.
 */

/**
 * Impact sound — short percussive hit played on player collision.
 *
 * @example
 * ```ts
 * const sfx = useSound('tone', IMPACT_SOUND_CONFIG);
 * ```
 */
export const IMPACT_SOUND_CONFIG = {
    wave: 'square' as const,
    frequency: [300, 100] as [number, number],
    duration: 0.1,
    gain: 0.15,
};
