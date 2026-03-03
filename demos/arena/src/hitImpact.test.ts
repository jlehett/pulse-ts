import {
    triggerHitImpact,
    updateHitImpacts,
    getActiveHitImpacts,
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
} from './hitImpact';

beforeEach(() => {
    resetHitImpacts();
});

describe('triggerHitImpact', () => {
    it('activates a slot', () => {
        expect(hasActiveHitImpact()).toBe(false);
        triggerHitImpact(1, 2);
        expect(hasActiveHitImpact()).toBe(true);
    });

    it('stores world position', () => {
        triggerHitImpact(3.5, -1.2);
        const active = getActiveHitImpacts().find((s) => s.active);
        expect(active).toBeDefined();
        expect(active!.worldX).toBe(3.5);
        expect(active!.worldZ).toBe(-1.2);
    });

    it('starts with age 0', () => {
        triggerHitImpact(0, 0);
        const active = getActiveHitImpacts().find((s) => s.active);
        expect(active!.age).toBe(0);
    });

    it('supports multiple simultaneous impacts', () => {
        for (let i = 0; i < HIT_IMPACT_POOL_SIZE; i++) {
            triggerHitImpact(i, 0);
        }
        const activeCount = getActiveHitImpacts().filter(
            (s) => s.active,
        ).length;
        expect(activeCount).toBe(HIT_IMPACT_POOL_SIZE);
    });

    it('recycles oldest slot when all are full', () => {
        for (let i = 0; i < HIT_IMPACT_POOL_SIZE; i++) {
            triggerHitImpact(i * 0.1, 0);
            updateHitImpacts(0.01);
        }

        // Trigger one more — should recycle the oldest
        triggerHitImpact(99, 99);

        const activeCount = getActiveHitImpacts().filter(
            (s) => s.active,
        ).length;
        expect(activeCount).toBe(HIT_IMPACT_POOL_SIZE);

        // Verify the new impact was placed
        const found = getActiveHitImpacts().some(
            (s) => s.active && s.worldX === 99 && s.worldZ === 99,
        );
        expect(found).toBe(true);
    });
});

describe('updateHitImpacts', () => {
    it('ages active slots', () => {
        triggerHitImpact(0, 0);
        updateHitImpacts(0.1);
        const active = getActiveHitImpacts().find((s) => s.active);
        expect(active!.age).toBeCloseTo(0.1);
    });

    it('expires impacts after their duration', () => {
        triggerHitImpact(0, 0);
        expect(hasActiveHitImpact()).toBe(true);
        updateHitImpacts(HIT_IMPACT_DURATION + 0.01);
        expect(hasActiveHitImpact()).toBe(false);
    });

    it('does not expire before duration', () => {
        triggerHitImpact(0, 0);
        updateHitImpacts(HIT_IMPACT_DURATION * 0.5);
        expect(hasActiveHitImpact()).toBe(true);
    });

    it('does not affect inactive slots', () => {
        updateHitImpacts(1.0);
        expect(hasActiveHitImpact()).toBe(false);
    });
});

describe('resetHitImpacts', () => {
    it('clears all active impacts', () => {
        triggerHitImpact(1, 2);
        triggerHitImpact(3, 4);
        expect(hasActiveHitImpact()).toBe(true);
        resetHitImpacts();
        expect(hasActiveHitImpact()).toBe(false);
    });

    it('resets age and position', () => {
        triggerHitImpact(5, 6);
        updateHitImpacts(0.5);
        resetHitImpacts();
        for (const slot of getActiveHitImpacts()) {
            expect(slot.age).toBe(0);
            expect(slot.worldX).toBe(0);
            expect(slot.worldZ).toBe(0);
        }
    });
});

describe('getActiveHitImpacts', () => {
    it('returns the full slot array', () => {
        const slots = getActiveHitImpacts();
        expect(slots.length).toBe(HIT_IMPACT_POOL_SIZE);
    });

    it('reflects changes after trigger', () => {
        const slots = getActiveHitImpacts();
        const activeBefore = slots.filter((s) => s.active).length;
        expect(activeBefore).toBe(0);

        triggerHitImpact(1, 1);
        const activeAfter = slots.filter((s) => s.active).length;
        expect(activeAfter).toBe(1);
    });
});

describe('hasActiveHitImpact', () => {
    it('returns false when no impacts active', () => {
        expect(hasActiveHitImpact()).toBe(false);
    });

    it('returns true when at least one impact is active', () => {
        triggerHitImpact(0, 0);
        expect(hasActiveHitImpact()).toBe(true);
    });

    it('returns false after all impacts expire', () => {
        triggerHitImpact(0, 0);
        updateHitImpacts(HIT_IMPACT_DURATION + 0.1);
        expect(hasActiveHitImpact()).toBe(false);
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
        // Scatter should be bigger than normal player push (1.8)
        expect(HIT_SCATTER_RADIUS).toBeGreaterThan(1.8);
    });

    it('HIT_SCATTER_STRENGTH is positive and larger than dust push strength', () => {
        expect(HIT_SCATTER_STRENGTH).toBeGreaterThan(0);
        // Should be stronger than normal player push (1.5)
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
