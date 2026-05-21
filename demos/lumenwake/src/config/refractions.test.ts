import { describe, it, expect } from 'vitest';
import { REFRACTION_POOL, pickRandomRefractions } from './refractions';

describe('REFRACTION_POOL', () => {
    it('contains 15 refractions', () => {
        expect(REFRACTION_POOL).toHaveLength(15);
    });

    it('has unique IDs', () => {
        const ids = REFRACTION_POOL.map((r) => r.id);
        expect(new Set(ids).size).toBe(ids.length);
    });

    it('each refraction has exactly 3 tiers', () => {
        for (const r of REFRACTION_POOL) {
            expect(r.tiers).toHaveLength(3);
        }
    });

    it('each tier has a positive value and non-empty description', () => {
        for (const r of REFRACTION_POOL) {
            for (const tier of r.tiers) {
                expect(tier.value).toBeGreaterThan(0);
                expect(tier.description.length).toBeGreaterThan(0);
            }
        }
    });

    it('each refraction has a name, icon, and color', () => {
        for (const r of REFRACTION_POOL) {
            expect(r.name.length).toBeGreaterThan(0);
            expect(r.icon.length).toBeGreaterThan(0);
            expect(r.color).toBeGreaterThan(0);
        }
    });
});

describe('pickRandomRefractions', () => {
    it('returns the requested count', () => {
        const picks = pickRandomRefractions(3, new Map());
        expect(picks).toHaveLength(3);
    });

    it('returns unique refractions', () => {
        const picks = pickRandomRefractions(3, new Map());
        const ids = picks.map((r) => r.id);
        expect(new Set(ids).size).toBe(3);
    });

    it('excludes refractions already at max tier', () => {
        const maxedOut = new Map<string, number>();
        for (const r of REFRACTION_POOL) {
            maxedOut.set(r.id, 3);
        }
        const picks = pickRandomRefractions(3, maxedOut);
        expect(picks).toHaveLength(0);
    });

    it('excludes only maxed refractions, not partial tiers', () => {
        const partialTiers = new Map<string, number>();
        partialTiers.set(REFRACTION_POOL[0].id, 2);
        const picks = pickRandomRefractions(15, partialTiers);
        expect(picks).toHaveLength(15);
        expect(picks.some((r) => r.id === REFRACTION_POOL[0].id)).toBe(true);
    });

    it('returns fewer if not enough available', () => {
        const mostMaxed = new Map<string, number>();
        for (let i = 0; i < 14; i++) {
            mostMaxed.set(REFRACTION_POOL[i].id, 3);
        }
        const picks = pickRandomRefractions(3, mostMaxed);
        expect(picks).toHaveLength(1);
    });

    it('produces different orderings across calls (probabilistic)', () => {
        const results = new Set<string>();
        for (let i = 0; i < 20; i++) {
            const picks = pickRandomRefractions(3, new Map());
            results.add(picks.map((r) => r.id).join(','));
        }
        expect(results.size).toBeGreaterThan(1);
    });
});
