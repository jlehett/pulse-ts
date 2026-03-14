# Effect Pool

`useEffectPool` provides a fixed-size pool of timed effects with automatic aging, oldest-slot recycling, and auto-deactivation. It is ideal for visual effects that spawn repeatedly and expire after a set duration: shockwaves, hit impacts, floating damage numbers, explosions, etc.

## Quick start

```ts
import { useEffectPool } from '@pulse-ts/effects';
import { useFrameUpdate } from '@pulse-ts/core';

function HitEffects() {
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
}
```

## How it works

1. **Fixed allocation** -- `size` slots are pre-allocated at creation. No dynamic growth.
2. **Triggering** -- `pool.trigger(data)` activates the first inactive slot, shallow-merging the provided data onto the slot's existing data object. Zero per-trigger allocation.
3. **Recycling** -- When all slots are active, `trigger()` recycles the oldest active slot (highest `age`), ensuring new effects are always visible.
4. **Aging** -- Each fixed tick advances `age` (seconds since activation) on active slots.
5. **Auto-deactivation** -- When `age >= duration`, the slot is automatically deactivated.
6. **Progress** -- `slot.progress` is `age / duration` clamped to `[0, 1]`, useful for fade curves, size interpolation, and shader uniforms.

## API

### `useEffectPool(options)`

| Option | Type | Description |
|---|---|---|
| `size` | `number` | Maximum concurrent effects |
| `duration` | `number` | Seconds before auto-deactivation |
| `create` | `() => T` | Factory for slot data, called once per slot |

Returns an `EffectPoolHandle<T>` with:

| Member | Type | Description |
|---|---|---|
| `trigger(data)` | `(data: Partial<T>) => void` | Activate a slot with merged data |
| `active()` | `Iterable<EffectSlot<T>>` | Iterate currently active slots |
| `hasActive` | `boolean` | Whether any slot is active |
| `reset()` | `() => void` | Deactivate all slots |

Each `EffectSlot<T>` exposes:

| Field | Type | Description |
|---|---|---|
| `data` | `T` | The slot's user data |
| `age` | `number` | Seconds since activation |
| `progress` | `number` | `0` to `1` normalized progress |
| `active` | `boolean` | Always `true` when iterating `active()` |

## Examples

### Shockwave pool

```ts
const shockwaves = useEffectPool({
    size: 4,
    duration: 0.6,
    create: () => ({ u: 0, v: 0 }),
});

shockwaves.trigger({ u: screenU, v: screenV });

useFrameUpdate(() => {
    let i = 0;
    for (const slot of shockwaves.active()) {
        uniforms.uRippleRadii.value.setComponent(i, slot.progress * MAX_RADIUS);
        i++;
    }
});
```

### Floating damage numbers

```ts
const damageNumbers = useEffectPool({
    size: 8,
    duration: 1.5,
    create: () => ({ x: 0, y: 0, amount: 0 }),
});

damageNumbers.trigger({ x: enemyPos.x, y: enemyPos.y, amount: 42 });

for (const slot of damageNumbers.active()) {
    const floatY = slot.data.y + slot.progress * 2;
    const fade = 1 - slot.progress;
    // render slot.data.amount at (slot.data.x, floatY) with fade...
}
```

## Limitations

- Pool size is fixed at creation and cannot be changed.
- `trigger()` performs a shallow merge -- nested objects are replaced, not deep-merged.
- Ages advance on the fixed-update tick, so timing precision is bound by `fixedStepMs`.
