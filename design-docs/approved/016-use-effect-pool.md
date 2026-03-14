# Approved: Pooled Effect System (`useEffectPool`)

> Fixed-size pool of timed effects with automatic aging, recycling, and deactivation.

**Origin:** Engine Improvements #16 (`useEffectPool`).

---

## Summary

A new `useEffectPool` hook in `@pulse-ts/effects` that provides a generic fixed-size slot pool for timed game effects. Handles slot allocation, oldest-slot recycling when full, age tracking, and automatic deactivation when duration expires.

---

## Problem

The arena demo has 3 separate pooled-slot systems (shockwave, hit impact, supernova sprites) with near-identical architecture: find first free slot → recycle oldest if full → update ages each tick → deactivate expired. Each is ~30 lines of the same pool management boilerplate with different data shapes. This "fixed-size slot pool with recycling" pattern is fundamental to game effects but has no engine support.

---

## API

```typescript
interface EffectPoolOptions<T> {
    /** Maximum concurrent effects. */
    size: number;
    /** Duration in seconds before auto-deactivation. */
    duration: number;
    /** Factory for slot data. Called once per slot at pool creation. */
    create: () => T;
}

interface EffectSlot<T> {
    /** The slot's data (mutated via trigger). */
    readonly data: T;
    /** Seconds since activation. */
    readonly age: number;
    /** 0→1 normalized progress through duration. */
    readonly progress: number;
    /** Whether this slot is currently active. */
    readonly active: boolean;
}

interface EffectPoolHandle<T> {
    /** Activate a slot with the given data. Recycles oldest if full. */
    trigger(data: Partial<T>): void;
    /** Iterate active slots. */
    active(): Iterable<EffectSlot<T>>;
    /** Whether any slot is active. */
    readonly hasActive: boolean;
    /** Reset all slots to inactive. */
    reset(): void;
}

/**
 * Fixed-size pool of timed effects with automatic recycling.
 * Ages advance each fixed tick; expired slots auto-deactivate.
 *
 * @param options - Pool configuration.
 * @returns A handle for triggering and querying effects.
 *
 * @example
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
 *     // slot.data.worldX, slot.data.worldZ, slot.age, slot.progress
 * }
 */
function useEffectPool<T>(options: EffectPoolOptions<T>): EffectPoolHandle<T>;
```

---

## Usage Examples

### Hit impact pool

```typescript
const impacts = useEffectPool({
    size: 4,
    duration: 1.2,
    create: () => ({ worldX: 0, worldZ: 0 }),
});

// Trigger on collision
useOnCollisionStart(({ point }) => {
    impacts.trigger({ worldX: point[0], worldZ: point[2] });
});

// Render active impacts
useFrameUpdate(() => {
    for (const slot of impacts.active()) {
        const fade = 1 - slot.progress;
        // draw impact at slot.data.worldX, slot.data.worldZ with fade...
    }
});
```

### Shockwave pool

```typescript
const shockwaves = useEffectPool({
    size: 4,
    duration: 0.6,
    create: () => ({ u: 0, v: 0 }),
});

shockwaves.trigger({ u: screenU, v: screenV });

// Sync to shader uniforms
useFrameUpdate(() => {
    let i = 0;
    for (const slot of shockwaves.active()) {
        uniforms.uRippleRadii.value.setComponent(i, slot.progress * MAX_RADIUS);
        i++;
    }
});
```

### Floating damage numbers

```typescript
const damageNumbers = useEffectPool({
    size: 8,
    duration: 1.5,
    create: () => ({ x: 0, y: 0, amount: 0 }),
});

damageNumbers.trigger({ x: enemyPos.x, y: enemyPos.y, amount: 42 });

for (const slot of damageNumbers.active()) {
    const floatY = slot.data.y + slot.progress * 2; // float upward
    const fade = 1 - slot.progress;
    // render slot.data.amount at (slot.data.x, floatY) with fade...
}
```

---

## Design Decisions

- **Fixed size, no dynamic growth** — Game effects should have bounded memory. The pool size is chosen at creation and never changes. This is a feature, not a limitation — it prevents runaway effect spawning.
- **Oldest-slot recycling** — When all slots are active and a new effect is triggered, the oldest active slot is recycled. This ensures new effects are always visible, and old ones are the least noticeable to lose.
- **`progress` field (0→1)** — Normalized progress is more useful than raw age for most consumers (fade curves, size interpolation, shader uniforms). Raw `age` is still available when needed.
- **Ages advance in fixed tick** — Consistent timing regardless of frame rate.
- **`create` factory** — Slots are pre-allocated at pool creation. `trigger()` mutates existing slot data via shallow merge rather than allocating new objects. Zero per-trigger allocation.
