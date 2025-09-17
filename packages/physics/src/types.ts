import type { Vec3 } from '@pulse-ts/core';

/**
 * Supported high-level rigid body motion types.
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
    /** Optional override for the global gravity vector. */
    gravity?: { x: number; y: number; z: number } | Vec3;
    /** Reserved for future constraint solving iteration tuning. */
    iterations?: number;
    /** Optional infinite horizontal plane enforced at the given world-space Y value. */
    worldPlaneY?: number;
    /** Cell size used for the broadphase uniform grid. */
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
    node: any; // Node
    /** Distance from the ray origin to the intersection point. */
    distance: number;
    /** World-space hit point. */
    point: { x: number; y: number; z: number };
    /** World-space unit normal pointing away from the hit surface. */
    normal: { x: number; y: number; z: number };
}
