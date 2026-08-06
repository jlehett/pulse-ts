import { Ecosystem } from './ecosystem';
import { createRng } from './rng';
import { DEFAULT_CONFIG, PHOTO_CASTE } from './types';

/** A tiny world for fast primitive tests. */
const CONFIG = {
    ...DEFAULT_CONFIG,
    worldSize: 80,
    fieldCells: 32,
    capacity: 4000,
};

describe('Ecosystem lineage & split primitives', () => {
    it('accrues Pressure from turnover, and drain resets it', () => {
        const eco = new Ecosystem(CONFIG, [PHOTO_CASTE], createRng(1));
        eco.seed(0, 40, 40, 40, 15, 3);
        for (let s = 0; s < 300; s++) eco.step(); // births/deaths happen
        const p = eco.drainPressure(0);
        expect(p).toBeGreaterThan(0);
        expect(eco.drainPressure(0)).toBe(0); // drained
    });

    it('addCaste registers a runtime caste under a lineage', () => {
        const eco = new Ecosystem(CONFIG, [PHOTO_CASTE], createRng(1));
        const idx = eco.addCaste({ ...PHOTO_CASTE, name: 'Branch' }, 0);
        expect(idx).toBe(1);
        expect(eco.castes.length).toBe(2);
        expect(eco.lineageOf[idx]).toBe(0);
    });

    it('reassignFraction splits a caste roughly by proportion, deterministically', () => {
        const make = () => {
            const eco = new Ecosystem(CONFIG, [PHOTO_CASTE], createRng(42));
            eco.seed(0, 0, 40, 40, 1, 3);
            // Seed a known population directly.
            for (let i = 0; i < 200; i++) eco.pop.spawn(40, 40, 3, 0);
            const to = eco.addCaste({ ...PHOTO_CASTE, name: 'B' }, 0);
            const moved = eco.reassignFraction(0, to, 0.5);
            return { eco, to, moved };
        };
        const a = make();
        const b = make();
        // Deterministic.
        expect(a.moved).toBe(b.moved);
        // Roughly half of 200.
        expect(a.moved).toBeGreaterThan(60);
        expect(a.moved).toBeLessThan(140);
        // Total conserved across the two castes.
        expect(a.eco.countOf(0) + a.eco.countOf(a.to)).toBe(200);
    });

    it('biomassOfLineage sums across a lineage’s castes', () => {
        const eco = new Ecosystem(CONFIG, [PHOTO_CASTE], createRng(1));
        for (let i = 0; i < 100; i++) eco.pop.spawn(40, 40, 3, 0);
        const to = eco.addCaste({ ...PHOTO_CASTE, name: 'B', size: 2 }, 0);
        eco.reassignFraction(0, to, 0.5);
        // Both castes belong to lineage 0, so its biomass covers all 100 organisms.
        const total = eco.countOf(0) * PHOTO_CASTE.size + eco.countOf(to) * 2;
        expect(eco.biomassOfLineage(0)).toBeCloseTo(total);
    });

    it('separates Pressure and biomass by lineage', () => {
        const eco = new Ecosystem(
            CONFIG,
            [PHOTO_CASTE, { ...PHOTO_CASTE, name: 'Other' }],
            createRng(1),
            [0, 1],
        );
        for (let i = 0; i < 50; i++) eco.pop.spawn(20, 20, 3, 0);
        for (let i = 0; i < 30; i++) eco.pop.spawn(60, 60, 3, 1);
        expect(eco.countOfLineage(0)).toBe(50);
        expect(eco.countOfLineage(1)).toBe(30);
    });
});
