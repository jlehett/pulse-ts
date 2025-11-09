import type { Vec3, Node } from '@pulse-ts/core';

/**
 * Supported high-level rigid body motion types.
 * - `dynamic`: simulated; affected by forces, impulses, gravity, and collisions.
 * - `kinematic`: controlled externally (e.g., set directly); does not respond to forces.
 * - `static`: immovable; used for level geometry or anchors.
 */
export type RigidBodyType = 'dynamic' | 'kinematic' | 'static';

/**
 * Configuration options used when installing the physics service.
 *
 * @example
 * ```ts
 * installPhysics(world, {
 *   gravity: { x: 0, y: -9.81, z: 0 },
 *   worldPlaneY: 0,
 * });
 * ```
 */
export interface PhysicsOptions {
    /** Optional override for the global gravity vector. Defaults to `{ x: 0, y: -9.81, z: 0 }`. */
    gravity?: { x: number; y: number; z: number } | Vec3;
    /** Reserved for future constraint solving iteration tuning. */
    iterations?: number;
    /** Penetration slop (in world units) not corrected to avoid jitter. Defaults to 0.005. */
    contactSlop?: number;
    /** Baumgarte position correction factor (0..1). Defaults to 0.2. */
    baumgarte?: number;
    /** Optional infinite horizontal plane enforced at the given world-space Y value. */
    worldPlaneY?: number;
    /** Cell size used for the broadphase uniform grid. Defaults to `1`. */
    cellSize?: number;
}

/**
 * Data returned when a raycast successfully intersects a collider.
 *
 * @example
 * ```ts
 * const hit = physics.raycast(origin, direction, 50);
 * if (hit) console.log(hit.node.id, hit.distance);
 * ```
 */
export interface RaycastHit {
    /** The node that owns the hit collider. */
    node: Node;
    /** Distance from the ray origin to the intersection point. */
    distance: number;
    /** World-space hit point. */
    point: { x: number; y: number; z: number };
    /** World-space unit normal pointing away from the hit surface. */
    normal: { x: number; y: number; z: number };
}
