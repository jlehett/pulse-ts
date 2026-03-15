/**
 * Shared particle burst configurations used across player nodes and replay.
 *
 * Each config omits `color` so callers can supply a per-player or fixed color
 * when invoking `useParticleBurst`.
 */

/**
 * Trail burst — small particles emitted behind a moving player.
 *
 * @example
 * ```ts
 * const burst = useParticleBurst({ ...TRAIL_BURST_CONFIG, color: playerColor });
 * ```
 */
export const TRAIL_BURST_CONFIG = {
    count: 8,
    lifetime: 1.0,
    speed: [0.2, 0.8] as [number, number],
    gravity: 1,
    size: 0.4,
    blending: 'additive' as const,
    shrink: true,
};

/**
 * Impact burst — white particles emitted at a collision point.
 *
 * @example
 * ```ts
 * const burst = useParticleBurst({ ...IMPACT_BURST_CONFIG, color: 0xffffff });
 * ```
 */
export const IMPACT_BURST_CONFIG = {
    count: 16,
    lifetime: 0.4,
    color: 0xffffff,
    speed: [1, 3] as [number, number],
    gravity: 6,
    size: 0.3,
    blending: 'additive' as const,
};
