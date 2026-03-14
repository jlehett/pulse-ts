jest.mock(
    '@pulse-ts/core',
    () => ({
        defineStore: (name: string, factory: () => any) => ({
            _key: Symbol(name),
            _factory: factory,
        }),
        useStore: jest.fn(),
    }),
    { virtual: true },
);

jest.mock(
    '@pulse-ts/effects',
    () => ({
        useEffectPool: jest.fn(),
    }),
    { virtual: true },
);

import {
    HitImpactStore,
    useHitImpactPool,
    HIT_IMPACT_POOL_SIZE,
    HIT_IMPACT_DURATION,
    HIT_SCATTER_RADIUS,
    HIT_SCATTER_STRENGTH,
    HIT_RIPPLE_DISPLACEMENT,
    HIT_RIPPLE_MAX_RADIUS,
    HIT_RIPPLE_EXPAND_DURATION,
    HIT_RIPPLE_RING_WIDTH,
} from './hitImpact';

describe('useHitImpactPool', () => {
    it('is an exported function', () => {
        expect(typeof useHitImpactPool).toBe('function');
    });
});

describe('HitImpactStore', () => {
    it('is a defined store with a _key and _factory', () => {
        expect(HitImpactStore._key).toBeDefined();
        expect(typeof HitImpactStore._factory).toBe('function');
    });

    it('factory produces an object with null pool', () => {
        const state = HitImpactStore._factory();
        expect(state.pool).toBeNull();
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
