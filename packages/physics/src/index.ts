/**
 * @packageDocumentation
 * Lightweight, modular physics for Pulse TS.
 *
 * Features:
 * - Rigid bodies with forces, impulses, and simple angular motion
 * - Sphere and oriented box (OBB) colliders, triggers, and basic material props
 * - Fixed-step integration via `PhysicsSystem`
 * - Raycasts and collision events with convenient FC hooks
 *
 * Quick start
 * ```ts
 * import { World } from '@pulse-ts/core';
 * import { installPhysics, useRigidBody, useSphereCollider } from '@pulse-ts/physics';
 *
 * const world = new World();
 * const physics = installPhysics(world, { gravity: { x: 0, y: -9.81, z: 0 } });
 *
 * // inside a function component
 * const body = useRigidBody({ mass: 2 });
 * useSphereCollider(0.5);
 * body.applyForce(0, 20, 0);
 * ```
 *
 * Collisions in a function component
 * ```ts
 * useOnCollisionStart(({ other }) => console.log('hit', other.id));
 * useOnCollisionEnd(() => console.log('left'));
 * ```
 *
 * Raycast
 * ```ts
 * const hit = usePhysicsRaycast()(new Vec3(0, 1, -5), new Vec3(0, 0, 1), 10);
 * if (hit) console.log(hit.distance);
 * ```
 */

// Installer
export { installPhysics } from './install';

// Service + System
export { PhysicsService } from './services/Physics';
export { PhysicsSystem } from './systems/step';
export type { CollisionPair } from './services/Physics';

// Components
export { RigidBody } from './components/RigidBody';
export type { Vec3Like } from './components/RigidBody';
export { Collider, SphereCollider, BoxCollider } from './components/Collider';

// FC Hooks
export {
    usePhysics,
    useRigidBody,
    useSphereCollider,
    useBoxCollider,
    useOnCollisionStart,
    useOnCollisionEnd,
    useOnCollision,
    usePhysicsRaycast,
} from './fc/hooks';

// Types
export type { PhysicsOptions, RigidBodyType, RaycastHit } from './types';
