import {
    HitImpactStore,
    triggerHitImpact,
    updateHitImpacts,
    hasActiveHitImpact,
    resetHitImpacts,
    HIT_IMPACT_POOL_SIZE,
    HIT_IMPACT_DURATION,
    HIT_SCATTER_RADIUS,
    HIT_SCATTER_STRENGTH,
    HIT_RIPPLE_DISPLACEMENT,
    HIT_RIPPLE_MAX_RADIUS,
    HIT_RIPPLE_EXPAND_DURATION,
    HIT_RIPPLE_RING_WIDTH,
    type HitImpactSlot,
} from './hitImpact';

function createSlots(): HitImpactSlot[] {
    return HitImpactStore._factory().slots;
}

describe('triggerHitImpact', () => {
    it('activates a slot', () => {
        const slots = createSlots();
        expect(hasActiveHitImpact(slots)).toBe(false);
        triggerHitImpact(slots, 1, 2);
        expect(hasActiveHitImpact(slots)).toBe(true);
    });

    it('stores world position', () => {
        const slots = createSlots();
        triggerHitImpact(slots, 3.5, -1.2);
        const active = slots.find((s) => s.active);
        expect(active).toBeDefined();
        expect(active!.worldX).toBe(3.5);
        expect(active!.worldZ).toBe(-1.2);
    });

    it('starts with age 0', () => {
        const slots = createSlots();
        triggerHitImpact(slots, 0, 0);
        const active = slots.find((s) => s.active);
        expect(active!.age).toBe(0);
    });

    it('supports multiple simultaneous impacts', () => {
        const slots = createSlots();
        for (let i = 0; i < HIT_IMPACT_POOL_SIZE; i++) {
            triggerHitImpact(slots, i, 0);
        }
        const activeCount = slots.filter((s) => s.active).length;
        expect(activeCount).toBe(HIT_IMPACT_POOL_SIZE);
    });

    it('recycles oldest slot when all are full', () => {
        const slots = createSlots();
        for (let i = 0; i < HIT_IMPACT_POOL_SIZE; i++) {
            triggerHitImpact(slots, i * 0.1, 0);
            updateHitImpacts(slots, 0.01);
        }

        triggerHitImpact(slots, 99, 99);

        const activeCount = slots.filter((s) => s.active).length;
        expect(activeCount).toBe(HIT_IMPACT_POOL_SIZE);

        const found = slots.some(
            (s) => s.active && s.worldX === 99 && s.worldZ === 99,
        );
        expect(found).toBe(true);
    });
});

describe('updateHitImpacts', () => {
    it('ages active slots', () => {
        const slots = createSlots();
        triggerHitImpact(slots, 0, 0);
        updateHitImpacts(slots, 0.1);
        const active = slots.find((s) => s.active);
        expect(active!.age).toBeCloseTo(0.1);
    });

    it('expires impacts after their duration', () => {
        const slots = createSlots();
        triggerHitImpact(slots, 0, 0);
        expect(hasActiveHitImpact(slots)).toBe(true);
        updateHitImpacts(slots, HIT_IMPACT_DURATION + 0.01);
        expect(hasActiveHitImpact(slots)).toBe(false);
    });

    it('does not expire before duration', () => {
        const slots = createSlots();
        triggerHitImpact(slots, 0, 0);
        updateHitImpacts(slots, HIT_IMPACT_DURATION * 0.5);
        expect(hasActiveHitImpact(slots)).toBe(true);
    });

    it('does not affect inactive slots', () => {
        const slots = createSlots();
        updateHitImpacts(slots, 1.0);
        expect(hasActiveHitImpact(slots)).toBe(false);
    });
});

describe('resetHitImpacts', () => {
    it('clears all active impacts', () => {
        const slots = createSlots();
        triggerHitImpact(slots, 1, 2);
        triggerHitImpact(slots, 3, 4);
        expect(hasActiveHitImpact(slots)).toBe(true);
        resetHitImpacts(slots);
        expect(hasActiveHitImpact(slots)).toBe(false);
    });

    it('resets age and position', () => {
        const slots = createSlots();
        triggerHitImpact(slots, 5, 6);
        updateHitImpacts(slots, 0.5);
        resetHitImpacts(slots);
        for (const slot of slots) {
            expect(slot.age).toBe(0);
            expect(slot.worldX).toBe(0);
            expect(slot.worldZ).toBe(0);
        }
    });
});

describe('hasActiveHitImpact', () => {
    it('returns false when no impacts active', () => {
        const slots = createSlots();
        expect(hasActiveHitImpact(slots)).toBe(false);
    });

    it('returns true when at least one impact is active', () => {
        const slots = createSlots();
        triggerHitImpact(slots, 0, 0);
        expect(hasActiveHitImpact(slots)).toBe(true);
    });

    it('returns false after all impacts expire', () => {
        const slots = createSlots();
        triggerHitImpact(slots, 0, 0);
        updateHitImpacts(slots, HIT_IMPACT_DURATION + 0.1);
        expect(hasActiveHitImpact(slots)).toBe(false);
    });
});

describe('HitImpactStore', () => {
    it('factory creates correct pool size', () => {
        const slots = createSlots();
        expect(slots.length).toBe(HIT_IMPACT_POOL_SIZE);
    });

    it('factory returns fresh objects each call', () => {
        const a = HitImpactStore._factory();
        const b = HitImpactStore._factory();
        expect(a).not.toBe(b);
        expect(a.slots).not.toBe(b.slots);
    });
});

describe('constants', () => {
    it('HIT_IMPACT_POOL_SIZE is positive', () => {
        expect(HIT_IMPACT_POOL_SIZE).toBeGreaterThan(0);
    });

    it('HIT_IMPACT_DURATION is positive', () => {
        expect(HIT_IMPACT_DURATION).toBeGreaterThan(0);
    });

    it('HIT_SCATTER_RADIUS is positive and larger than dust push radius', () => {
        expect(HIT_SCATTER_RADIUS).toBeGreaterThan(0);
        expect(HIT_SCATTER_RADIUS).toBeGreaterThan(1.8);
    });

    it('HIT_SCATTER_STRENGTH is positive and larger than dust push strength', () => {
        expect(HIT_SCATTER_STRENGTH).toBeGreaterThan(0);
        expect(HIT_SCATTER_STRENGTH).toBeGreaterThan(1.5);
    });

    it('HIT_RIPPLE_DISPLACEMENT is positive and less than 1', () => {
        expect(HIT_RIPPLE_DISPLACEMENT).toBeGreaterThan(0);
        expect(HIT_RIPPLE_DISPLACEMENT).toBeLessThan(1);
    });

    it('HIT_RIPPLE_MAX_RADIUS is between 0 and 1', () => {
        expect(HIT_RIPPLE_MAX_RADIUS).toBeGreaterThan(0);
        expect(HIT_RIPPLE_MAX_RADIUS).toBeLessThanOrEqual(1);
    });

    it('HIT_RIPPLE_EXPAND_DURATION is positive and within impact duration', () => {
        expect(HIT_RIPPLE_EXPAND_DURATION).toBeGreaterThan(0);
        expect(HIT_RIPPLE_EXPAND_DURATION).toBeLessThanOrEqual(
            HIT_IMPACT_DURATION,
        );
    });

    it('HIT_RIPPLE_RING_WIDTH is positive and less than max radius', () => {
        expect(HIT_RIPPLE_RING_WIDTH).toBeGreaterThan(0);
        expect(HIT_RIPPLE_RING_WIDTH).toBeLessThan(HIT_RIPPLE_MAX_RADIUS);
    });
});
