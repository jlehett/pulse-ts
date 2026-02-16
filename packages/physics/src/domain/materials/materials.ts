import type { RigidBody } from '../../public/components/RigidBody';
import type { Collider } from '../../public/components/Collider';

/** Default restitution used when not specified on body/collider. */
export const DEFAULT_RESTITUTION = 0.2;
/** Default friction used when not specified on body/collider. */
export const DEFAULT_FRICTION = 0.5;

/** Returns the effective restitution value for a single object (body+collider). */
export function getRestitution(
    body?: RigidBody | null,
    collider?: Collider | null,
    fallback = DEFAULT_RESTITUTION,
): number {
    const a = body?.restitution;
    const b = collider?.restitution;
    if (typeof a === 'number' && typeof b === 'number') return Math.max(a, b);
    if (typeof a === 'number') return a;
    if (typeof b === 'number') return b;
    return fallback;
}

/** Returns the effective friction value for a single object (body+collider). */
export function getFriction(
    body?: RigidBody | null,
    collider?: Collider | null,
    fallback = DEFAULT_FRICTION,
): number {
    const a = body?.friction;
    const b = collider?.friction;
    if (typeof a === 'number' && typeof b === 'number') return Math.max(a, b);
    if (typeof a === 'number') return a;
    if (typeof b === 'number') return b;
    return fallback;
}

/**
 * Mixes restitution for a contact using the "maximum" rule commonly used in games.
 * Returns a scalar in [0, 1].
 */
export function combineRestitution(
    bodyA?: RigidBody | null,
    colA?: Collider | null,
    bodyB?: RigidBody | null,
    colB?: Collider | null,
    fallback = DEFAULT_RESTITUTION,
): number {
    const eA = getRestitution(bodyA ?? null, colA ?? null, fallback);
    const eB = getRestitution(bodyB ?? null, colB ?? null, fallback);
    return Math.max(eA, eB);
}

/**
 * Mixes friction for a contact using the geometric mean of the per-object effective frictions.
 * Each object's effective friction is the max(body, collider).
 */
export function combineFriction(
    bodyA?: RigidBody | null,
    colA?: Collider | null,
    bodyB?: RigidBody | null,
    colB?: Collider | null,
    fallback = DEFAULT_FRICTION,
): number {
    const fA = getFriction(bodyA ?? null, colA ?? null, fallback);
    const fB = getFriction(bodyB ?? null, colB ?? null, fallback);
    return Math.sqrt(Math.max(0, fA) * Math.max(0, fB));
}
