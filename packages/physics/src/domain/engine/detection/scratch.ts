import { Vec3 } from '@pulse-ts/core';

/**
 * Frame-scoped Vec3 pool for the collision-detection pass.
 *
 * All intermediate Vec3 values computed during a single `detectCollision`,
 * `detectManifold`, `capsuleObb`, or `capsuleCapsule` call are drawn from
 * this pool instead of being heap-allocated. Because every detection function
 * is synchronous and non-reentrant, the pool index can be reset to zero at
 * the start of each public entry point without risk of aliasing live
 * references from a prior call.
 *
 * The pool holds 128 instances — enough for the worst-case path
 * (box-box manifold) which peaks at roughly 50 live Vec3 slots.
 *
 * Usage pattern:
 * ```ts
 * // At the top of every public detection function:
 * resetPool();
 *
 * // Anywhere a temporary Vec3 is needed:
 * const v = sv3(x, y, z);
 * ```
 */

const POOL_SIZE = 128;
const _pool: Vec3[] = Array.from({ length: POOL_SIZE }, () => new Vec3());
let _idx = 0;

/**
 * Returns the next pooled Vec3, setting it to `(x, y, z)`.
 * The returned instance is valid until `resetPool()` is called again and the
 * pool index wraps back to this slot.
 */
export function sv3(x = 0, y = 0, z = 0): Vec3 {
    const v = _pool[_idx]!;
    _idx = (_idx + 1) % POOL_SIZE;
    v.x = x;
    v.y = y;
    v.z = z;
    return v;
}

/**
 * Resets the pool index to zero. Call once at the start of each public
 * detection entry point before any `sv3()` calls.
 */
export function resetPool(): void {
    _idx = 0;
}
