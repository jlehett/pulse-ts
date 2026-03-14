/**
 * Pure math utilities for virtual joystick touch computation.
 * Handles displacement, deadzone application, and normalization.
 *
 * @module
 */

/**
 * Raw displacement from a joystick center to a touch point.
 */
export interface JoystickDisplacement {
    /** Pixel offset from center on the X axis. */
    dx: number;
    /** Pixel offset from center on the Y axis. */
    dy: number;
    /** Distance from center in pixels. */
    distance: number;
    /** Angle in radians from positive X axis. */
    angle: number;
}

/**
 * Normalized joystick output after deadzone and clamping.
 */
export interface JoystickOutput {
    /** Normalized X axis value (-1 to 1). */
    x: number;
    /** Normalized Y axis value (-1 to 1). */
    y: number;
    /** Magnitude after deadzone (0 to 1). */
    magnitude: number;
    /** Angle in radians. */
    angle: number;
}

/**
 * Compute raw displacement between a center point and a touch point.
 *
 * @param centerX - Center X coordinate in pixels.
 * @param centerY - Center Y coordinate in pixels.
 * @param touchX - Touch X coordinate in pixels.
 * @param touchY - Touch Y coordinate in pixels.
 * @returns Raw displacement with distance and angle.
 *
 * @example
 * ```ts
 * const d = computeDisplacement(60, 60, 90, 60);
 * // d.dx === 30, d.dy === 0, d.distance === 30, d.angle === 0
 * ```
 */
export function computeDisplacement(
    centerX: number,
    centerY: number,
    touchX: number,
    touchY: number,
): JoystickDisplacement {
    const dx = touchX - centerX;
    const dy = touchY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    return { dx, dy, distance, angle };
}

/**
 * Apply deadzone and normalize joystick displacement to -1..1 range.
 *
 * When distance is within the deadzone radius, output is zero.
 * Beyond the deadzone, output is linearly rescaled so the usable range
 * maps to 0..1 magnitude, clamped at `maxRadius`.
 *
 * @param displacement - Raw displacement from {@link computeDisplacement}.
 * @param maxRadius - Maximum radius in pixels (half the joystick size).
 * @param deadzone - Deadzone as a fraction of maxRadius (0 to 1). Default 0.15.
 * @returns Normalized output with deadzone applied.
 *
 * @example
 * ```ts
 * const d = computeDisplacement(60, 60, 90, 60);
 * const out = applyDeadzone(d, 50, 0.15);
 * // out.x ~= 0.588, out.y === 0, out.magnitude ~= 0.588
 * ```
 */
export function applyDeadzone(
    displacement: JoystickDisplacement,
    maxRadius: number,
    deadzone: number = 0.15,
): JoystickOutput {
    if (maxRadius <= 0) {
        return { x: 0, y: 0, magnitude: 0, angle: displacement.angle };
    }

    const dzRadius = deadzone * maxRadius;
    const { distance, angle } = displacement;

    if (distance <= dzRadius) {
        return { x: 0, y: 0, magnitude: 0, angle };
    }

    // Rescale so that dzRadius..maxRadius maps to 0..1
    const usableRange = maxRadius - dzRadius;
    const clampedDistance = Math.min(distance, maxRadius);
    const magnitude = (clampedDistance - dzRadius) / usableRange;

    const x = Math.cos(angle) * magnitude;
    const y = Math.sin(angle) * magnitude;

    return { x, y, magnitude, angle };
}

/**
 * Clamp pixel displacement to a maximum radius, returning clamped pixel offsets.
 * Used for visual knob positioning.
 *
 * @param dx - X displacement in pixels.
 * @param dy - Y displacement in pixels.
 * @param maxRadius - Maximum radius in pixels.
 * @returns Clamped pixel offsets `{ x, y }`.
 *
 * @example
 * ```ts
 * const clamped = clampToRadius(100, 0, 50);
 * // clamped === { x: 50, y: 0 }
 * ```
 */
export function clampToRadius(
    dx: number,
    dy: number,
    maxRadius: number,
): { x: number; y: number } {
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist <= maxRadius) {
        return { x: dx, y: dy };
    }
    const scale = maxRadius / dist;
    return { x: dx * scale, y: dy * scale };
}
