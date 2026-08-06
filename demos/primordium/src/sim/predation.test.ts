import { Ecosystem } from './ecosystem';
import { createRng } from './rng';
import { CARNIVORE_CASTE, DEFAULT_CONFIG, PHOTO_CASTE } from './types';

const CASTES = [PHOTO_CASTE, CARNIVORE_CASTE];

function run(seed: number, steps: number, sampleEvery = 0) {
    const eco = new Ecosystem(DEFAULT_CONFIG, CASTES, createRng(seed));
    const c = DEFAULT_CONFIG.worldSize / 2;
    eco.seed(0, 20, c, c, 15, 3); // prey bloom
    eco.seed(1, 8, c, c, 15, 6); // predators
    const prey: number[] = [];
    const pred: number[] = [];
    for (let s = 0; s < steps; s++) {
        eco.step();
        if (sampleEvery && s % sampleEvery === 0) {
            prey.push(eco.countOf(0));
            pred.push(eco.countOf(1));
        }
    }
    return { eco, prey, pred };
}

describe('predation', () => {
    it('is deterministic with two interacting castes', () => {
        const a = run(2026, 900);
        const b = run(2026, 900);
        expect(a.eco.countOf(0)).toBe(b.eco.countOf(0));
        expect(a.eco.countOf(1)).toBe(b.eco.countOf(1));
        expect(a.eco.biomass()).toBe(b.eco.biomass());
    });

    it('predators reproduce by hunting and the two populations interact', () => {
        const steps = 2400; // 80s
        const { prey, pred } = run(99, steps, 30);
        const preyPeak = Math.max(...prey);
        const predPeak = Math.max(...pred);

        console.log('prey (per ~1s): ', prey.join(' '));

        console.log('pred (per ~1s): ', pred.join(' '));

        // Prey bloomed from its seed of 20.
        expect(preyPeak).toBeGreaterThan(20);
        // Predators grew past their seed of 8 — they must have fed to reproduce.
        expect(predPeak).toBeGreaterThan(8);
        // Bounded: no runaway to capacity.
        expect(preyPeak).toBeLessThan(DEFAULT_CONFIG.capacity);
        expect(predPeak).toBeLessThan(DEFAULT_CONFIG.capacity);
    });

    it('a lone predator with no prey cannot sustain itself', () => {
        const eco = new Ecosystem(DEFAULT_CONFIG, CASTES, createRng(5));
        const c = DEFAULT_CONFIG.worldSize / 2;
        eco.seed(1, 10, c, c, 10, 6); // predators only, no prey
        for (let s = 0; s < 1200; s++) eco.step();
        // With nothing to eat, upkeep drains them to extinction.
        expect(eco.countOf(1)).toBe(0);
    });
});
