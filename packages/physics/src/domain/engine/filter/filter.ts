import { Collider } from '../../../public/components/Collider';

/** Decides whether two colliders should be considered for collision. */
export interface CollisionFilter {
    shouldCollide(a: Collider, b: Collider): boolean;
}

/**
 * Default filter checks layer/mask bitmasks on both colliders.
 * Collides if (a.mask & b.layer) != 0 AND (b.mask & a.layer) != 0.
 */
export const defaultFilter: CollisionFilter = {
    shouldCollide(a: Collider, b: Collider): boolean {
        return (a.mask & b.layer) !== 0 && (b.mask & a.layer) !== 0;
    },
};
