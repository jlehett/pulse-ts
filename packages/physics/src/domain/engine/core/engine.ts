import type { Vec3 } from '@pulse-ts/core';
import type { Collider } from '../../../public/components/Collider';
import type { RigidBody } from '../../../public/components/RigidBody';
import type { RaycastHit } from '../../types';
import type { RaycastOptions } from '../raycast/raycast';
import {
    integrateTransforms,
    integrateVelocities,
} from '../dynamics/integration';
import { findPairs } from '../broadphase/pairing';
import { detectCollision, type Contact } from '../detection/detect';
import { resolveContact } from '../solver/solver';
import { raycast } from '../raycast/raycast';
import { defaultFilter, type CollisionFilter } from '../filter/filter';

/**
 * Updates body velocities from forces/impulses and applies movement to transforms.
 */
export interface Integrator {
    /** Apply forces, impulses, torques, gravity, and damping to velocities. */
    updateVelocities(
        bodies: Iterable<RigidBody>,
        gravity: Vec3,
        dt: number,
        hasCollider: (c: Collider) => boolean,
    ): void;
    /** Apply velocities to positions and rotations, with optional world-plane constraint. */
    applyMovement(
        bodies: Iterable<RigidBody>,
        dt: number,
        planeY?: number,
    ): void;
}

/** Quick pass to find potentially overlapping collider pairs (uses bounding boxes). */
export interface PairFinder {
    findPairs(
        colliders: Iterable<Collider>,
        cellSize: number,
    ): Array<[Collider, Collider]>;
}

/** Accurate shape-vs-shape test that returns contact info for a candidate pair. */
export interface ContactDetector {
    detect(a: Collider, b: Collider): Contact;
}

/** Resolves overlap and adjusts velocities using restitution and friction. */
export interface ContactSolver {
    resolve(
        a: Collider,
        b: Collider,
        contact: { nx: number; ny: number; nz: number; depth: number },
    ): void;
}

/** Casts a ray and returns the closest hit, if any. */
export interface Raycaster {
    cast(
        colliders: Iterable<Collider>,
        origin: Vec3,
        dir: Vec3,
        maxOrOpts?: number | RaycastOptions,
        filter?: (c: Collider) => boolean,
    ): RaycastHit | null;
}

/** Full engine contract used by PhysicsService. */
export interface PhysicsEngine {
    integrator: Integrator;
    pairFinder: PairFinder;
    detector: ContactDetector;
    solver: ContactSolver;
    raycaster: Raycaster;
    filter: CollisionFilter;
}

/** Default engine strategies used by PhysicsService (replaceable for customization/testing). */
export const DefaultEngine: PhysicsEngine = {
    integrator: {
        updateVelocities: integrateVelocities,
        applyMovement: integrateTransforms,
    } as Integrator,
    pairFinder: { findPairs } as PairFinder,
    detector: { detect: detectCollision } as ContactDetector,
    solver: { resolve: resolveContact } as ContactSolver,
    raycaster: { cast: raycast } as Raycaster,
    filter: defaultFilter as CollisionFilter,
};
