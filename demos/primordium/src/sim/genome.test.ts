import { CARDS, CARD_LIST, compileGenome } from './genome';
import { PHOTO_CASTE } from './types';

describe('compileGenome', () => {
    it('with no cards reproduces the base genome (bar the name)', () => {
        const g = compileGenome('X', []);
        expect({ ...g, name: PHOTO_CASTE.name }).toEqual(PHOTO_CASTE);
    });

    it('is deterministic: same cards, same order => identical caste', () => {
        const a = compileGenome('A', [CARDS.fast, CARDS.biggerBody]);
        const b = compileGenome('A', [CARDS.fast, CARDS.biggerBody]);
        expect(a).toEqual(b);
    });

    it('Predation makes a carnivore that no longer photosynthesizes', () => {
        const g = compileGenome('Fang', [CARDS.predation]);
        expect(g.metabolism).toBe('carnivore');
        expect(g.harvestRate).toBe(0);
        expect(g.reach).toBeGreaterThan(0);
        expect(g.killEnergy).toBeGreaterThan(0);
        expect(g.size).toBeGreaterThan(PHOTO_CASTE.size);
    });

    it('Bigger Body trades reproduction speed for mass', () => {
        const g = compileGenome('Titan', [CARDS.biggerBody]);
        expect(g.size).toBeGreaterThan(PHOTO_CASTE.size);
        expect(g.spawnCost).toBeGreaterThan(PHOTO_CASTE.spawnCost);
        expect(g.moveSpeed).toBeLessThan(PHOTO_CASTE.moveSpeed);
    });

    it('Fleet increases speed at an upkeep cost', () => {
        const g = compileGenome('Runner', [CARDS.fast]);
        expect(g.moveSpeed).toBeGreaterThan(PHOTO_CASTE.moveSpeed);
        expect(g.upkeep).toBeGreaterThan(PHOTO_CASTE.upkeep);
    });

    it('cards compose in order', () => {
        const g = compileGenome('Swarm', [CARDS.prolific, CARDS.fast]);
        // prolific shrinks & speeds reproduction; fast raises speed
        expect(g.spawnCooldown).toBeLessThan(PHOTO_CASTE.spawnCooldown);
        expect(g.size).toBeLessThan(PHOTO_CASTE.size);
        expect(g.moveSpeed).toBeGreaterThan(PHOTO_CASTE.moveSpeed);
    });

    it('every card in the pool has a unique id and is applicable', () => {
        const ids = new Set(CARD_LIST.map((c) => c.id));
        expect(ids.size).toBe(CARD_LIST.length);
        for (const card of CARD_LIST) {
            const g = compileGenome('T', [card]);
            expect(g).toBeDefined();
            expect(Number.isFinite(g.size)).toBe(true);
        }
    });
});
