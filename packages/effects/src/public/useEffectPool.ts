import { useFixedUpdate } from '@pulse-ts/core';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Configuration for {@link useEffectPool}.
 *
 * @typeParam T - Shape of user data stored in each slot.
 */
export interface EffectPoolOptions<T> {
    /** Maximum concurrent effects. */
    size: number;
    /** Duration in seconds before auto-deactivation. */
    duration: number;
    /** Factory for slot data. Called once per slot at pool creation. */
    create: () => T;
}

/**
 * A single slot in an effect pool.
 *
 * @typeParam T - Shape of user data stored in the slot.
 */
export interface EffectSlot<T> {
    /** The slot's data (mutated via trigger). */
    readonly data: T;
    /** Seconds since activation. */
    readonly age: number;
    /** 0 to 1 normalized progress through duration. */
    readonly progress: number;
    /** Whether this slot is currently active. */
    readonly active: boolean;
}

/**
 * Handle for interacting with an effect pool.
 *
 * @typeParam T - Shape of user data stored in each slot.
 */
export interface EffectPoolHandle<T> {
    /** Activate a slot with the given data. Recycles oldest if full. */
    trigger(data: Partial<T>): void;
    /** Iterate active slots. */
    active(): Iterable<EffectSlot<T>>;
    /** Whether any slot is active. */
    readonly hasActive: boolean;
    /** Reset all slots to inactive. */
    reset(): void;
}

// ---------------------------------------------------------------------------
// Internal slot representation
// ---------------------------------------------------------------------------

interface InternalSlot<T> {
    data: T;
    age: number;
    active: boolean;
}

// ---------------------------------------------------------------------------
// useEffectPool
// ---------------------------------------------------------------------------

/**
 * Fixed-size pool of timed effects with automatic recycling.
 *
 * Ages advance each fixed tick; expired slots auto-deactivate.
 * When all slots are active and a new effect is triggered, the oldest
 * active slot is recycled to make room.
 *
 * @typeParam T - Shape of user data stored in each slot.
 * @param options - Pool configuration.
 * @returns A handle for triggering and querying effects.
 *
 * @example
 * ```ts
 * import { useEffectPool } from '@pulse-ts/effects';
 *
 * const impacts = useEffectPool({
 *     size: 4,
 *     duration: 1.2,
 *     create: () => ({ worldX: 0, worldZ: 0 }),
 * });
 *
 * // Trigger from collision handler
 * impacts.trigger({ worldX: surfX, worldZ: surfZ });
 *
 * // Read in frame update
 * for (const slot of impacts.active()) {
 *     const fade = 1 - slot.progress;
 *     // draw impact at slot.data.worldX, slot.data.worldZ with fade...
 * }
 * ```
 */
export function useEffectPool<T>(
    options: Readonly<EffectPoolOptions<T>>,
): EffectPoolHandle<T> {
    const { size, duration, create } = options;

    // Pre-allocate all slots
    const slots: InternalSlot<T>[] = [];
    for (let i = 0; i < size; i++) {
        slots.push({ data: create(), age: 0, active: false });
    }

    // Advance ages each fixed tick and auto-deactivate expired slots
    useFixedUpdate((dt) => {
        for (let i = 0; i < size; i++) {
            const slot = slots[i];
            if (!slot.active) continue;
            slot.age += dt;
            if (slot.age >= duration) {
                slot.active = false;
            }
        }
    });

    return {
        trigger(data: Partial<T>): void {
            // Find first inactive slot
            let target: InternalSlot<T> | undefined;
            for (let i = 0; i < size; i++) {
                if (!slots[i].active) {
                    target = slots[i];
                    break;
                }
            }

            // If no inactive slot, recycle the oldest active one
            if (!target) {
                let oldestAge = -1;
                for (let i = 0; i < size; i++) {
                    if (slots[i].age > oldestAge) {
                        oldestAge = slots[i].age;
                        target = slots[i];
                    }
                }
            }

            // Should always have a target since size > 0
            if (target) {
                // Shallow merge user data
                Object.assign(target.data as Record<string, unknown>, data);
                target.age = 0;
                target.active = true;
            }
        },

        active(): Iterable<EffectSlot<T>> {
            const activeSlots: EffectSlot<T>[] = [];
            for (let i = 0; i < size; i++) {
                const slot = slots[i];
                if (slot.active) {
                    activeSlots.push({
                        data: slot.data,
                        age: slot.age,
                        progress: Math.min(slot.age / duration, 1),
                        active: true,
                    });
                }
            }
            return activeSlots;
        },

        get hasActive(): boolean {
            for (let i = 0; i < size; i++) {
                if (slots[i].active) return true;
            }
            return false;
        },

        reset(): void {
            for (let i = 0; i < size; i++) {
                slots[i].age = 0;
                slots[i].active = false;
            }
        },
    };
}
