/**
 * Computes the world-space velocity of a point on a kinematic body's surface,
 * accounting for both linear and angular (rotational) motion.
 *
 * For the rotational component, this uses Rodrigues' rotation formula to rotate
 * the contact offset by `ω * dt` (exact arc), then derives velocity as
 * `(rotatedOffset - offset) / dt`. This eliminates the outward drift that a
 * tangent-only approximation (`ω × r`) would cause on spinning bodies.
 *
 * @param linearVelocity - The body's linear velocity.
 * @param angularVelocity - The body's angular velocity (rad/s per axis).
 * @param bodyPosition - The body's world-space position.
 * @param contactPoint - The world-space point on the body's surface.
 * @param dt - The fixed timestep in seconds.
 * @returns A `[vx, vy, vz]` tuple representing the surface velocity at the contact point.
 *
 * @example
 * ```ts
 * import { getKinematicSurfaceVelocity } from '@pulse-ts/physics';
 *
 * // Inside a fixed update:
 * const [vx, vy, vz] = getKinematicSurfaceVelocity(
 *     body.linearVelocity,
 *     body.angularVelocity,
 *     platformTransform.localPosition,
 *     hit.point,
 *     dt,
 * );
 * ```
 */
export function getKinematicSurfaceVelocity(
    linearVelocity: { x: number; y: number; z: number },
    angularVelocity: { x: number; y: number; z: number },
    bodyPosition: { x: number; y: number; z: number },
    contactPoint: { x: number; y: number; z: number },
    dt: number,
): [number, number, number] {
    let vx = linearVelocity.x;
    let vy = linearVelocity.y;
    let vz = linearVelocity.z;

    const wx = angularVelocity.x;
    const wy = angularVelocity.y;
    const wz = angularVelocity.z;

    const speedSq = wx * wx + wy * wy + wz * wz;
    if (speedSq > 1e-12) {
        // Offset from body center to contact point
        const rx = contactPoint.x - bodyPosition.x;
        const ry = contactPoint.y - bodyPosition.y;
        const rz = contactPoint.z - bodyPosition.z;

        // Rodrigues' rotation: rotate r by angle = |ω| * dt around axis ω/|ω|
        const speed = Math.sqrt(speedSq);
        const angle = speed * dt;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        // Unit axis
        const inv = 1 / speed;
        const ax = wx * inv;
        const ay = wy * inv;
        const az = wz * inv;

        // dot(axis, r)
        const dot = ax * rx + ay * ry + az * rz;

        // cross(axis, r)
        const cx = ay * rz - az * ry;
        const cy = az * rx - ax * rz;
        const cz = ax * ry - ay * rx;

        // Rotated offset: r' = r*cos + cross(axis, r)*sin + axis*dot(axis, r)*(1 - cos)
        const oneMinusCos = 1 - cos;
        const newRx = rx * cos + cx * sin + ax * dot * oneMinusCos;
        const newRy = ry * cos + cy * sin + ay * dot * oneMinusCos;
        const newRz = rz * cos + cz * sin + az * dot * oneMinusCos;

        // Velocity = displacement / dt
        vx += (newRx - rx) / dt;
        vy += (newRy - ry) / dt;
        vz += (newRz - rz) / dt;
    }

    return [vx, vy, vz];
}
