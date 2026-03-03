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
// Slot state
// ---------------------------------------------------------------------------

/** A single hit impact slot tracking position and age. */
export interface HitImpactSlot {
    /** Whether this slot is currently active. */
    active: boolean;
    /** World-space X position of the hit. */
    worldX: number;
    /** World-space Z position of the hit. */
    worldZ: number;
    /** Age of the impact in seconds (0 = just triggered). */
    age: number;
}

const slots: HitImpactSlot[] = Array.from(
    { length: HIT_IMPACT_POOL_SIZE },
    () => ({
        active: false,
        worldX: 0,
        worldZ: 0,
        age: 0,
    }),
);

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Trigger a hit impact at the given world-space position.
 * If all slots are occupied, the oldest (highest age) is recycled.
 *
 * @param worldX - World-space X coordinate of the hit.
 * @param worldZ - World-space Z coordinate of the hit.
 *
 * @example
 * ```ts
 * triggerHitImpact(2.5, -1.0);
 * ```
 */
export function triggerHitImpact(worldX: number, worldZ: number): void {
    let slot = slots.find((s) => !s.active);
    if (!slot) {
        // Recycle oldest — highest age
        slot = slots.reduce((oldest, s) => (s.age > oldest.age ? s : oldest));
    }
    slot.active = true;
    slot.worldX = worldX;
    slot.worldZ = worldZ;
    slot.age = 0;
}

/**
 * Advance all active hit impacts by `dt` seconds. Deactivates expired ones.
 *
 * @param dt - Frame delta time in seconds.
 *
 * @example
 * ```ts
 * updateHitImpacts(1 / 60);
 * ```
 */
export function updateHitImpacts(dt: number): void {
    for (const slot of slots) {
        if (!slot.active) continue;
        slot.age += dt;
        if (slot.age >= HIT_IMPACT_DURATION) {
            slot.active = false;
        }
    }
}

/**
 * Returns a readonly view of the slot array for reading active hit impacts.
 *
 * @returns The array of hit impact slots.
 *
 * @example
 * ```ts
 * for (const slot of getActiveHitImpacts()) {
 *     if (slot.active) { ... }
 * }
 * ```
 */
export function getActiveHitImpacts(): readonly HitImpactSlot[] {
    return slots;
}

/**
 * Returns `true` if at least one hit impact slot is active.
 *
 * @example
 * ```ts
 * if (hasActiveHitImpact()) { ... }
 * ```
 */
export function hasActiveHitImpact(): boolean {
    return slots.some((s) => s.active);
}

/**
 * Reset all hit impact slots to inactive. Useful for testing.
 *
 * @example
 * ```ts
 * resetHitImpacts();
 * ```
 */
export function resetHitImpacts(): void {
    for (const s of slots) {
        s.active = false;
        s.worldX = 0;
        s.worldZ = 0;
        s.age = 0;
    }
}
