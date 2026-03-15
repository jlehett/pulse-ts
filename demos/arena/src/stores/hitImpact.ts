import { createSharedPool } from './createSharedPool';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Maximum simultaneous hit impact slots. */
export const HIT_IMPACT_POOL_SIZE = 4;

/** Duration of the hit impact effect in seconds. */
export const HIT_IMPACT_DURATION = 1.2;

/** Radius around hit point that scatters atmospheric dust (world units). */
export const HIT_SCATTER_RADIUS = 6.0;

/** Push strength for scattering atmospheric dust near a hit. */
export const HIT_SCATTER_STRENGTH = 7.0;

/** Peak UV displacement for the grid ripple ring. */
export const HIT_RIPPLE_DISPLACEMENT = 0.04;

/** Maximum normalized radius the ripple ring expands to (0–1 UV space). */
export const HIT_RIPPLE_MAX_RADIUS = 0.9;

/** Seconds for the ripple ring to expand from center to max radius. */
export const HIT_RIPPLE_EXPAND_DURATION = 0.9;

/** Radial width of the ripple ring band (UV units). */
export const HIT_RIPPLE_RING_WIDTH = 0.08;

// ---------------------------------------------------------------------------
// Hit impact data shape
// ---------------------------------------------------------------------------

/** Data stored in each hit impact pool slot. */
export interface HitImpactData {
    /** World-space X position of the hit. */
    worldX: number;
    /** World-space Z position of the hit. */
    worldZ: number;
}

// ---------------------------------------------------------------------------
// Shared pool (store + hook via factory)
// ---------------------------------------------------------------------------

/**
 * World-scoped store and hook for the hit impact effect pool.
 *
 * `HitImpactStore` holds the pool handle; `useHitImpactPool` lazily creates
 * it on first call and shares it with all subsequent callers in the same world.
 *
 * @example
 * ```ts
 * const impacts = useHitImpactPool();
 * impacts.trigger({ worldX: 2.5, worldZ: -1.0 });
 *
 * for (const slot of impacts.active()) {
 *     const fade = 1 - slot.progress;
 *     // use slot.data.worldX, slot.data.worldZ, slot.age, fade ...
 * }
 * ```
 */
export const { Store: HitImpactStore, usePool: useHitImpactPool } =
    createSharedPool<HitImpactData>('hitImpact', {
        size: HIT_IMPACT_POOL_SIZE,
        duration: HIT_IMPACT_DURATION,
        create: () => ({ worldX: 0, worldZ: 0 }),
    });
