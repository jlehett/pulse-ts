// Installer
export { installPhysics } from './install';

// Service + System
export { PhysicsService } from './services/Physics';
export { PhysicsSystem } from './systems/step';

// Components
export { RigidBody } from './components/RigidBody';
export type { Vec3Like } from './components/RigidBody';
export { Collider, SphereCollider, BoxCollider } from './components/Collider';

// FC Hooks
export { usePhysics, useRigidBody, useSphereCollider, useBoxCollider, useOnCollisionStart, useOnCollisionEnd, useOnCollision, usePhysicsRaycast } from './fc/hooks';

// Types
export type { PhysicsOptions, RigidBodyType, RaycastHit } from './types';

