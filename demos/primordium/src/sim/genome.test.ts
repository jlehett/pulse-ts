import { CARDS, CARD_BRANCHES, CARD_LIST, compileGenome } from './genome';
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

    it('Fleet increases speed at the cost of breeding pace', () => {
        const g = compileGenome('Runner', [CARDS.fast]);
        expect(g.moveSpeed).toBeGreaterThan(PHOTO_CASTE.moveSpeed);
        expect(g.spawnCooldown).toBeGreaterThan(PHOTO_CASTE.spawnCooldown);
    });

    it('cards compose in order', () => {
        const g = compileGenome('Swarm', [CARDS.prolific, CARDS.dwarfism]);
        // prolific speeds reproduction; dwarfism shrinks the body
        expect(g.spawnCooldown).toBeLessThan(PHOTO_CASTE.spawnCooldown);
        expect(g.size).toBeLessThan(PHOTO_CASTE.size);
        expect(g.spawnCost).toBeLessThan(PHOTO_CASTE.spawnCost);
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

    it('every card compiles to a caste the sim can actually run', () => {
        for (const card of CARD_LIST) {
            const g = compileGenome('T', [card]);
            for (const [key, value] of Object.entries(g)) {
                if (key === 'name' || key === 'metabolism') continue;
                // A NaN or negative anywhere here poisons the hot loop silently.
                expect(
                    Number.isFinite(value) ||
                        value === Number.POSITIVE_INFINITY,
                ).toBe(true);
                expect(value as number).toBeGreaterThanOrEqual(0);
            }
            expect(g.size).toBeGreaterThan(0);
            expect(g.lifespan).toBeGreaterThan(0);
            // Anything that still grazes must be able to out-earn its own
            // upkeep on good ground, or the card is a death sentence.
            if (g.metabolism !== 'carnivore') {
                expect(g.harvestRate).toBeGreaterThan(g.upkeep);
            }
        }
    });

    it('assigns every card to a declared branch', () => {
        const branches = new Set(CARD_BRANCHES.map((b) => b.id));
        for (const card of CARD_LIST)
            expect(branches.has(card.branch)).toBe(true);
        // Every branch is populated, so the evolve panel has no empty headings.
        for (const b of CARD_BRANCHES) {
            expect(CARD_LIST.some((c) => c.branch === b.id)).toBe(true);
        }
    });

    it('offers a pool broad enough to build distinct strategies from', () => {
        expect(CARD_LIST.length).toBeGreaterThanOrEqual(20);
    });

    it('keeps every card near the size-per-upkeep score invariant', () => {
        // Standing population is budget/upkeep and biomass is size x that, so
        // size/upkeep IS the score multiplier. A card that moves one without the
        // other is a silent score swing no amount of flavour text offsets.
        const base = PHOTO_CASTE.size / PHOTO_CASTE.upkeep;
        for (const card of CARD_LIST) {
            const g = compileGenome('T', [card]);
            if (g.metabolism === 'carnivore') continue; // its own economy
            const ratio = g.size / g.upkeep / base;
            expect(ratio).toBeGreaterThan(0.8);
            expect(ratio).toBeLessThan(1.25);
        }
    });

    it('Carapace defends without adding scoring mass', () => {
        const g = compileGenome('Shell', [CARDS.carapace]);
        expect(g.defense).toBeGreaterThan(0);
        expect(g.size).toBe(PHOTO_CASTE.size);
        expect(g.moveSpeed).toBeLessThan(PHOTO_CASTE.moveSpeed);
    });

    it('Omnivore both grazes and hunts, worse than either specialist', () => {
        const g = compileGenome('Omni', [CARDS.omnivore]);
        expect(g.metabolism).toBe('omnivore');
        expect(g.harvestRate).toBeLessThan(PHOTO_CASTE.harvestRate);
        expect(g.killEnergy).toBeLessThan(
            compileGenome('Pred', [CARDS.predation]).killEnergy,
        );
    });

    it('Deep Roots trades mobility for feeding on thin ground', () => {
        const g = compileGenome('Roots', [CARDS.deepRoots]);
        expect(g.harvestHalfSat).toBeLessThan(PHOTO_CASTE.harvestHalfSat);
        expect(g.moveSpeed).toBeLessThan(PHOTO_CASTE.moveSpeed);
    });
});
