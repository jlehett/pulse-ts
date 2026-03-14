/**
 * Linear interpolation: `a + (b - a) * t`.
 *
 * Does not clamp `t` — values outside `[0, 1]` will extrapolate.
 *
 * @param a - Start value.
 * @param b - End value.
 * @param t - Interpolation factor (0 = a, 1 = b).
 * @returns The interpolated value.
 *
 * @example
 * ```ts
 * import { lerp } from '@pulse-ts/core';
 *
 * lerp(0, 100, 0.5);  // 50
 * lerp(0, 100, 1.5);  // 150 (extrapolates)
 * lerp(10, 20, 0);    // 10
 * lerp(10, 20, 1);    // 20
 * ```
 */
export function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}

/**
 * Inverse linear interpolation: `(value - a) / (b - a)`, clamped to `[0, 1]`.
 *
 * Returns the normalized position of `value` within the range `[a, b]`.
 * If `a === b`, returns `0` to avoid division by zero.
 *
 * @param a - Range start.
 * @param b - Range end.
 * @param value - Value to normalize.
 * @returns The normalized position, clamped to `[0, 1]`.
 *
 * @example
 * ```ts
 * import { inverseLerp } from '@pulse-ts/core';
 *
 * inverseLerp(0, 100, 50);   // 0.5
 * inverseLerp(0, 100, 150);  // 1 (clamped)
 * inverseLerp(0, 100, -10);  // 0 (clamped)
 * ```
 */
export function inverseLerp(a: number, b: number, value: number): number {
    if (a === b) return 0;
    const t = (value - a) / (b - a);
    return t < 0 ? 0 : t > 1 ? 1 : t;
}

/**
 * Frame-rate-independent exponential damping.
 *
 * Smoothly approaches `target` regardless of frame rate using the formula:
 * `current + (target - current) * (1 - exp(-rate * dt))`.
 *
 * @param current - Current value.
 * @param target - Target value.
 * @param rate - Damping rate (higher = faster approach).
 * @param dt - Delta time in seconds.
 * @returns The damped value.
 *
 * @example
 * ```ts
 * import { damp } from '@pulse-ts/core';
 *
 * // Network smoothing
 * position.x = damp(position.x, target.x, 25, dt);
 *
 * // Asymmetric damping (fast attack, slow release)
 * const rate = targetMag > currentMag ? 8 : 2;
 * currentX = damp(currentX, targetX, rate, dt);
 * ```
 */
export function damp(
    current: number,
    target: number,
    rate: number,
    dt: number,
): number {
    return current + (target - current) * (1 - Math.exp(-rate * dt));
}

/**
 * Hermite smoothstep: smooth transition from `edge0` to `edge1`.
 *
 * Returns `0` below `edge0`, `1` above `edge1`, and a smooth S-curve
 * between. Matches the GLSL `smoothstep` signature.
 *
 * @param edge0 - Lower edge.
 * @param edge1 - Upper edge.
 * @param x - Input value.
 * @returns The smoothstepped value in `[0, 1]`.
 *
 * @example
 * ```ts
 * import { smoothstep } from '@pulse-ts/core';
 *
 * smoothstep(0, 1, 0.5);  // ~0.5 (smooth)
 * smoothstep(0, 1, 0);    // 0
 * smoothstep(0, 1, 1);    // 1
 * smoothstep(0, 1, -1);   // 0 (clamped)
 * smoothstep(0, 1, 2);    // 1 (clamped)
 * ```
 */
export function smoothstep(edge0: number, edge1: number, x: number): number {
    const t = (x - edge0) / (edge1 - edge0);
    const c = t < 0 ? 0 : t > 1 ? 1 : t;
    return c * c * (3 - 2 * c);
}

/**
 * Clamps a value between `min` and `max`.
 *
 * @param value - Input value.
 * @param min - Minimum bound.
 * @param max - Maximum bound.
 * @returns The clamped value.
 *
 * @example
 * ```ts
 * import { clamp } from '@pulse-ts/core';
 *
 * clamp(15, 0, 10);  // 10
 * clamp(-5, 0, 10);  // 0
 * clamp(5, 0, 10);   // 5
 * ```
 */
export function clamp(value: number, min: number, max: number): number {
    return value < min ? min : value > max ? max : value;
}

/**
 * Remaps a value from one range to another.
 *
 * Maps `value` from the input range `[inMin, inMax]` to the output range
 * `[outMin, outMax]`. Does not clamp — values outside the input range
 * will extrapolate. Use {@link clamp} if bounds are needed.
 *
 * @param value - Input value.
 * @param inMin - Input range start.
 * @param inMax - Input range end.
 * @param outMin - Output range start.
 * @param outMax - Output range end.
 * @returns The remapped value.
 *
 * @example
 * ```ts
 * import { remap } from '@pulse-ts/core';
 *
 * remap(50, 0, 100, 0, 1);     // 0.5
 * remap(15, 10, 20, 0, 100);   // 50
 * remap(distance, 0, 50, 1, 0); // volume falloff
 * ```
 */
export function remap(
    value: number,
    inMin: number,
    inMax: number,
    outMin: number,
    outMax: number,
): number {
    const t = (value - inMin) / (inMax - inMin);
    return outMin + (outMax - outMin) * t;
}
