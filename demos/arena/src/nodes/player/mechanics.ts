/**
 * Pure utility functions for player mechanics calculations.
 * These are stateless helpers used by both local and AI player nodes.
 */

/**
 * Compute a knockback impulse vector from one position to another.
 * The impulse points away from the other player and is scaled by the
 * given magnitude. Includes an upward component for arc.
 *
 * @param selfX - Local player X position.
 * @param selfZ - Local player Z position.
 * @param otherX - Other player X position.
 * @param otherZ - Other player Z position.
 * @param magnitude - Impulse strength.
 * @returns An `[x, y, z]` impulse vector.
 *
 * @example
 * ```ts
 * computeKnockback(0, 0, -1, 0, 8); // [8, 0, 0] — pushed right
 * ```
 */
export function computeKnockback(
    selfX: number,
    selfZ: number,
    otherX: number,
    otherZ: number,
    magnitude: number,
): [number, number, number] {
    const dx = selfX - otherX;
    const dz = selfZ - otherZ;
    const len = Math.sqrt(dx * dx + dz * dz);
    if (len > 0) {
        return [(dx / len) * magnitude, 0, (dz / len) * magnitude];
    }
    // Overlapping — push in arbitrary direction
    return [magnitude, 0, 0];
}

/**
 * Compute how fast a body is moving **toward** a target position.
 * Returns the component of the attacker's velocity along the direction
 * from attacker to target (clamped to >= 0 — retreating gives 0).
 *
 * @param selfX - Target player X.
 * @param selfZ - Target player Z.
 * @param otherX - Attacker X.
 * @param otherZ - Attacker Z.
 * @param otherVx - Attacker velocity X.
 * @param otherVz - Attacker velocity Z.
 * @returns Approach speed (>= 0). Zero for glancing or retreating movement.
 *
 * @example
 * ```ts
 * // Attacker at (-5,0) moving at (10,0) toward target at (0,0)
 * computeApproachSpeed(0, 0, -5, 0, 10, 0); // 10
 *
 * // Attacker moving perpendicular — glancing blow
 * computeApproachSpeed(0, 0, -5, 0, 0, 10); // 0
 * ```
 */
export function computeApproachSpeed(
    selfX: number,
    selfZ: number,
    otherX: number,
    otherZ: number,
    otherVx: number,
    otherVz: number,
): number {
    const dx = selfX - otherX;
    const dz = selfZ - otherZ;
    const len = Math.sqrt(dx * dx + dz * dz);
    if (len < 0.01) {
        // Overlapping — use full velocity magnitude as approach speed
        return Math.sqrt(otherVx * otherVx + otherVz * otherVz);
    }
    // Dot product of velocity with direction toward self, clamped to >= 0
    const dot = (otherVx * dx + otherVz * dz) / len;
    return Math.max(0, dot);
}

/**
 * Compute the normalized dash direction from a movement input vector.
 * If the input is zero-length, defaults to forward (negative Z).
 *
 * @param moveX - Horizontal input axis value.
 * @param moveY - Vertical input axis value (W/up = positive).
 * @returns A normalized `[x, z]` direction tuple in world space.
 *
 * @example
 * ```ts
 * computeDashDirection(1, 0);  // [1, 0]  — dash right
 * computeDashDirection(0, 1);  // [0, -1] — dash forward
 * computeDashDirection(0, 0);  // [0, -1] — default forward
 * ```
 */
export function computeDashDirection(
    moveX: number,
    moveY: number,
): [number, number] {
    const len = Math.sqrt(moveX * moveX + moveY * moveY);
    if (len > 0) {
        return [moveX / len, -moveY / len]; // W = forward = -Z
    }
    return [0, -1]; // default forward
}
