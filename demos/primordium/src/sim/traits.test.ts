import { Ecosystem, canEat, grazes, hunts } from './ecosystem';
import { CARDS, compileGenome } from './genome';
import { createRng } from './rng';
import { CARNIVORE_CASTE, DEFAULT_CONFIG, PHOTO_CASTE } from './types';
import type { Caste } from './types';

/** A small world so these stay fast and deterministic. */
const CONFIG = {
    ...DEFAULT_CONFIG,
    worldSize: 80,
    fieldCells: 32,
    capacity: 4000,
};

describe('predation ladder', () => {
    it('lets a predator eat only what it can overpower', () => {
        expect(canEat(CARNIVORE_CASTE, PHOTO_CASTE)).toBe(true);
        expect(canEat(PHOTO_CASTE, CARNIVORE_CASTE)).toBe(false); // grazers never hunt
        expect(canEat(CARNIVORE_CASTE, CARNIVORE_CASTE)).toBe(false); // not its own size
    });

    it('armour prices a caste off the menu without adding scoring mass', () => {
        const plain = compileGenome('Plain', []);
        const armoured = compileGenome('Armoured', [CARDS.carapace]);
        expect(canEat(CARNIVORE_CASTE, plain)).toBe(true);
        expect(canEat(CARNIVORE_CASTE, armoured)).toBe(false);
        // Defence is not mass: it must not inflate the biomass score.
        expect(armoured.size).toBe(plain.size);
    });

    it('prey reach lets a predator take on peers it otherwise could not', () => {
        const normal = compileGenome('Normal', [CARDS.predation]);
        const apex = compileGenome('Apex', [CARDS.predation, CARDS.apexJaws]);
        const peer = compileGenome('Peer', [CARDS.predation]);
        expect(canEat(normal, peer)).toBe(false); // same size — a standoff
        expect(canEat(apex, peer)).toBe(true); // punches above its weight
    });

    it('classifies feeding modes, including omnivores doing both', () => {
        const omni = compileGenome('Omni', [CARDS.omnivore]);
        expect(hunts(omni)).toBe(true);
        expect(grazes(omni)).toBe(true);
        expect(hunts(PHOTO_CASTE)).toBe(false);
        expect(grazes(CARNIVORE_CASTE)).toBe(false);
    });
});

describe('toxicity', () => {
    it('makes a kill a net energy loss for the predator', () => {
        // Compare the same predator against toxic vs harmless prey, since
        // compaction reorders the population and index 0 is not stable.
        const predatorEnergy = (preyToxicity: number) => {
            const prey: Caste = {
                ...PHOTO_CASTE,
                name: 'Prey',
                toxicity: preyToxicity,
            };
            const eco = new Ecosystem(
                CONFIG,
                [prey, CARNIVORE_CASTE],
                createRng(3),
            );
            for (let i = 0; i < 40; i++) eco.pop.spawn(40, 40, 20, 0);
            eco.pop.spawn(40, 40, 40, 1);
            for (let s = 0; s < 120; s++) eco.step();
            const pop = eco.pop;
            for (let i = 0; i < pop.count; i++) {
                if (pop.caste[i] === 1) return pop.energy[i];
            }
            return 0; // the predator starved outright
        };
        const onToxic = predatorEnergy(CARNIVORE_CASTE.killEnergy * 2);
        const onHarmless = predatorEnergy(0);
        expect(onToxic).toBeLessThan(onHarmless);
    });
});

describe('dormancy', () => {
    it('keeps a starving organism alive far longer than one without it', () => {
        // A lightless world, so the only thing that matters is burn rate.
        const dark = { ...CONFIG, lightInitial: 0, lightCap: 0, lightRegen: 0 };
        const survivors = (caste: Caste) => {
            const eco = new Ecosystem(dark, [caste], createRng(11));
            for (let i = 0; i < 30; i++) eco.pop.spawn(40, 40, 12, 0);
            for (let s = 0; s < 900; s++) eco.step();
            return eco.countOf(0);
        };
        const plain = compileGenome('Plain', []);
        const sleeper = compileGenome('Sleeper', [CARDS.dormancy]);
        expect(survivors(plain)).toBe(0);
        expect(survivors(sleeper)).toBeGreaterThan(0);
    });
});

describe('corpse fertility', () => {
    it('returns light to the field where organisms die', () => {
        const withFertility = (corpseFertility: number) => {
            const eco = new Ecosystem(
                { ...CONFIG, lightRegen: 0, corpseFertility },
                [{ ...PHOTO_CASTE, name: 'Doomed', lifespan: 1 }],
                createRng(5),
            );
            for (let i = 0; i < 50; i++) eco.pop.spawn(40, 40, 1, 0);
            for (let s = 0; s < 60; s++) eco.step();
            return eco.light.total();
        };
        // Same deaths, same grazing; the only difference is what corpses give back.
        expect(withFertility(0.5)).toBeGreaterThan(withFertility(0));
    });
});

describe('herding', () => {
    it('pulls a cohesive caste into tighter clusters than a solitary one', () => {
        const spread = (caste: Caste) => {
            const eco = new Ecosystem(CONFIG, [caste], createRng(9));
            eco.seed(0, 60, 40, 40, 25, caste.spawnThreshold * 0.5);
            for (let s = 0; s < 600; s++) eco.step();
            const pop = eco.pop;
            let cx = 0;
            let cy = 0;
            for (let i = 0; i < pop.count; i++) {
                cx += pop.x[i];
                cy += pop.y[i];
            }
            cx /= pop.count;
            cy /= pop.count;
            let d = 0;
            for (let i = 0; i < pop.count; i++) {
                d += Math.hypot(pop.x[i] - cx, pop.y[i] - cy);
            }
            return d / pop.count; // mean distance from the flock's centre
        };
        const loner = compileGenome('Loner', []);
        const herd = compileGenome('Herd', [CARDS.herdInstinct]);
        expect(spread(herd)).toBeLessThan(spread(loner));
    });
});

describe('dispersal', () => {
    it('scatters spores far from the parent', () => {
        const spores = compileGenome('Spores', [CARDS.windborneSpores]);
        expect(spores.spawnDispersal).toBeGreaterThan(
            PHOTO_CASTE.spawnDispersal * 10,
        );
    });
});
