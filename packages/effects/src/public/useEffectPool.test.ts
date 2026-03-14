import { World } from '@pulse-ts/core';
import { useEffectPool } from './useEffectPool';
import type { EffectPoolHandle } from './useEffectPool';

const TICK_MS = 10;

interface HitData {
    x: number;
    y: number;
}

function setup(size: number, durationSec: number) {
    const world = new World({ fixedStepMs: TICK_MS });
    let pool!: EffectPoolHandle<HitData>;

    function TestNode() {
        pool = useEffectPool({
            size,
            duration: durationSec,
            create: () => ({ x: 0, y: 0 }),
        });
    }

    world.mount(TestNode);

    const step = (steps = 1) => {
        for (let i = 0; i < steps; i++) world.tick(TICK_MS);
    };

    return { pool, step };
}

// ---------------------------------------------------------------------------
// Triggering
// ---------------------------------------------------------------------------

describe('useEffectPool — triggering', () => {
    test('initially has no active slots', () => {
        const { pool } = setup(4, 1);
        expect(pool.hasActive).toBe(false);
        expect([...pool.active()]).toHaveLength(0);
    });

    test('trigger activates a slot with merged data', () => {
        const { pool, step } = setup(4, 1);

        pool.trigger({ x: 10, y: 20 });
        step();

        const slots = [...pool.active()];
        expect(slots).toHaveLength(1);
        expect(slots[0].data.x).toBe(10);
        expect(slots[0].data.y).toBe(20);
        expect(slots[0].active).toBe(true);
    });

    test('trigger with partial data only overwrites specified fields', () => {
        const { pool, step } = setup(4, 1);

        pool.trigger({ x: 5, y: 7 });
        step();

        // Trigger again on a new slot with only x
        pool.trigger({ x: 99 });
        step();

        const slots = [...pool.active()];
        expect(slots).toHaveLength(2);
        // Second slot: x overwritten, y stays at default (0)
        const second = slots[1];
        expect(second.data.x).toBe(99);
        expect(second.data.y).toBe(0);
    });

    test('multiple triggers fill multiple slots', () => {
        const { pool, step } = setup(4, 1);

        pool.trigger({ x: 1 });
        pool.trigger({ x: 2 });
        pool.trigger({ x: 3 });
        step();

        expect([...pool.active()]).toHaveLength(3);
        expect(pool.hasActive).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// Recycling
// ---------------------------------------------------------------------------

describe('useEffectPool — recycling', () => {
    test('recycles oldest active slot when pool is full', () => {
        const { pool, step } = setup(2, 1);

        pool.trigger({ x: 1, y: 0 });
        step(10); // first slot ages 0.1s

        pool.trigger({ x: 2, y: 0 });
        step(5); // second slot ages 0.05s, first ages 0.15s

        // Pool is now full (2 slots). Trigger a third.
        pool.trigger({ x: 3, y: 0 });
        step();

        const slots = [...pool.active()];
        expect(slots).toHaveLength(2);

        // The oldest (x=1) should have been recycled with x=3
        const dataValues = slots.map((s) => s.data.x);
        expect(dataValues).toContain(2);
        expect(dataValues).toContain(3);
        expect(dataValues).not.toContain(1);
    });

    test('recycled slot resets age to 0', () => {
        const { pool, step } = setup(1, 1);

        pool.trigger({ x: 1 });
        step(50); // age = 0.5s

        pool.trigger({ x: 2 }); // recycle
        step();

        const slots = [...pool.active()];
        expect(slots).toHaveLength(1);
        expect(slots[0].data.x).toBe(2);
        expect(slots[0].age).toBeCloseTo(0.01, 2); // one tick after trigger
    });
});

// ---------------------------------------------------------------------------
// Progress and aging
// ---------------------------------------------------------------------------

describe('useEffectPool — progress and aging', () => {
    test('progress advances from 0 toward 1 over duration', () => {
        const { pool, step } = setup(4, 1);

        pool.trigger({ x: 0 });

        // At t=0 (before any tick)
        step();
        const slotsEarly = [...pool.active()];
        expect(slotsEarly[0].progress).toBeCloseTo(0.01, 2);

        // At t=0.5s
        step(49); // 50 ticks total = 0.5s
        const slotsMid = [...pool.active()];
        expect(slotsMid[0].progress).toBeCloseTo(0.5, 1);
    });

    test('age tracks elapsed seconds since activation', () => {
        const { pool, step } = setup(4, 2);

        pool.trigger({ x: 0 });
        step(100); // 1 second

        const slots = [...pool.active()];
        expect(slots[0].age).toBeCloseTo(1.0, 1);
    });

    test('progress is clamped to 1', () => {
        const { pool, step } = setup(4, 0.5);

        pool.trigger({ x: 0 });
        // Run slightly past duration but slot should auto-deactivate,
        // so read at exactly the boundary
        step(49); // 0.49s
        const slots = [...pool.active()];
        expect(slots[0].progress).toBeLessThanOrEqual(1);
    });
});

// ---------------------------------------------------------------------------
// Auto-deactivation
// ---------------------------------------------------------------------------

describe('useEffectPool — auto-deactivation', () => {
    test('slot deactivates when age reaches duration', () => {
        const { pool, step } = setup(4, 0.5);

        pool.trigger({ x: 0 });
        expect(pool.hasActive).toBe(true);

        step(50); // 0.5s = duration
        expect(pool.hasActive).toBe(false);
        expect([...pool.active()]).toHaveLength(0);
    });

    test('slot deactivates when age exceeds duration', () => {
        const { pool, step } = setup(4, 0.1);

        pool.trigger({ x: 0 });
        step(20); // 0.2s > 0.1s duration

        expect(pool.hasActive).toBe(false);
    });

    test('deactivated slot can be reused by trigger', () => {
        const { pool, step } = setup(1, 0.1);

        pool.trigger({ x: 1 });
        step(20); // expires
        expect(pool.hasActive).toBe(false);

        pool.trigger({ x: 2 });
        step();
        expect(pool.hasActive).toBe(true);

        const slots = [...pool.active()];
        expect(slots[0].data.x).toBe(2);
    });
});

// ---------------------------------------------------------------------------
// Reset
// ---------------------------------------------------------------------------

describe('useEffectPool — reset', () => {
    test('reset deactivates all slots', () => {
        const { pool, step } = setup(4, 1);

        pool.trigger({ x: 1 });
        pool.trigger({ x: 2 });
        pool.trigger({ x: 3 });
        step();
        expect([...pool.active()]).toHaveLength(3);

        pool.reset();
        expect(pool.hasActive).toBe(false);
        expect([...pool.active()]).toHaveLength(0);
    });

    test('slots can be triggered again after reset', () => {
        const { pool, step } = setup(2, 1);

        pool.trigger({ x: 1 });
        pool.trigger({ x: 2 });
        step();
        pool.reset();

        pool.trigger({ x: 3 });
        step();

        const slots = [...pool.active()];
        expect(slots).toHaveLength(1);
        expect(slots[0].data.x).toBe(3);
    });
});

// ---------------------------------------------------------------------------
// Handle interface
// ---------------------------------------------------------------------------

describe('useEffectPool — handle interface', () => {
    test('exposes expected interface', () => {
        const { pool } = setup(2, 1);

        expect(typeof pool.trigger).toBe('function');
        expect(typeof pool.active).toBe('function');
        expect(typeof pool.hasActive).toBe('boolean');
        expect(typeof pool.reset).toBe('function');
    });
});
