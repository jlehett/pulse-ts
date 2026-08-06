import { Ecosystem } from './ecosystem';
import { createRng } from './rng';
import { DEFAULT_CONFIG, PHOTO_CASTE } from './types';

function run(seed: number, steps: number, sampleEvery = 0) {
    const eco = new Ecosystem(DEFAULT_CONFIG, [PHOTO_CASTE], createRng(seed));
    const c = DEFAULT_CONFIG.worldSize / 2;
    // Seeded just under the spawn threshold, so the bloom starts promptly.
    eco.seed(0, 20, c, c, 15, PHOTO_CASTE.spawnThreshold * 0.9);
    const history: number[] = [];
    for (let s = 0; s < steps; s++) {
        eco.step();
        if (sampleEvery && s % sampleEvery === 0) {
            history.push(eco.populationCount());
        }
    }
    return { eco, history };
}

describe('Ecosystem', () => {
    it('is deterministic: same seed => identical outcome', () => {
        const a = run(2026, 600);
        const b = run(2026, 600);
        expect(a.eco.populationCount()).toBe(b.eco.populationCount());
        expect(a.eco.biomass()).toBe(b.eco.biomass());
        expect(a.eco.light.total()).toBeCloseTo(b.eco.light.total(), 5);
    });

    it('different seeds diverge', () => {
        const a = run(1, 600);
        const b = run(2, 600);
        // Extremely unlikely to match exactly across 600 stochastic steps.
        expect(a.eco.populationCount()).not.toBe(b.eco.populationCount());
    });

    it('biomass is the living count scaled by body size', () => {
        const { eco } = run(7, 300);
        expect(eco.biomass()).toBeCloseTo(
            eco.populationCount() * PHOTO_CASTE.size,
        );
    });

    it('blooms from the seed then stays bounded by carrying capacity', () => {
        const steps = 1500; // 50s at dt=1/30
        const { eco, history } = run(42, steps, 30);
        const peak = Math.max(...history);
        const final = eco.populationCount();

        console.log(
            'population curve (per ~1s):',
            history.join(' '),
            '| peak',
            peak,
            'final',
            final,
        );

        expect(peak).toBeGreaterThan(20); // a bloom occurred
        expect(final).toBeGreaterThan(0); // did not go extinct
        expect(peak).toBeLessThan(DEFAULT_CONFIG.capacity); // bounded, no runaway
    });
});
