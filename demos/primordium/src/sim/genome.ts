import { PHOTO_CASTE } from './types';
import type { Caste } from './types';

/**
 * The genome/card layer: a species (caste) is *compiled* from a base genome plus a
 * stack of mutation cards, rather than hand-authored. This is the seam the full
 * card game plugs into — for the MVP the card pool is small and covers what the
 * simulation can currently express (metabolism, body, reproduction, senses).
 *
 * Cards are authored as *capabilities and tradeoffs*, not raw stat lines: e.g.
 * Predation flips you to a carnivore (and gives up photosynthesis), Bigger Body
 * trades reproduction speed for mass. Each `apply` mutates a genome draft in order.
 */
export interface Card {
    /** Stable id. */
    id: string;
    /** Display name. */
    name: string;
    /** One-line description of the capability/tradeoff. */
    text: string;
    /** Evolutionary Pressure spent to play this card at a mutation event. */
    cost: number;
    /** Mutate the genome draft in place. Applied in deck order at compile time. */
    apply(g: Caste): void;
}

/**
 * Compile a genome (base + ordered cards) into a {@link Caste} the sim consumes.
 * Pure and deterministic: the same cards in the same order always compile to the
 * same caste.
 *
 * @param name - Species/caste label.
 * @param cards - Cards to apply, in order.
 * @returns The compiled caste.
 *
 * @example
 * const fang = compileGenome('Fang', [CARDS.predation, CARDS.fast]);
 */
export function compileGenome(name: string, cards: readonly Card[]): Caste {
    const g: Caste = { ...PHOTO_CASTE, name };
    for (const card of cards) card.apply(g);
    return g;
}

/**
 * The MVP card pool. Every card is a capability or a real tradeoff — no pure
 * upgrades.
 */
export const CARDS = {
    /** Become a carnivore: hunt and eat smaller organisms, but lose photosynthesis. */
    predation: {
        id: 'predation',
        cost: 4,
        name: 'Predation',
        text: 'Hunt and eat anything smaller than you; you no longer photosynthesize.',
        apply(g) {
            g.metabolism = 'carnivore';
            g.harvestRate = 0;
            g.conversion = 0;
            g.reach = 2.5;
            g.killEnergy = 6;
            g.attackCooldown = 1;
            g.visionRadius = Math.max(g.visionRadius, 22);
            g.moveSpeed *= 1.25;
            g.upkeep += 0.1;
            g.spawnThreshold = 8;
            g.spawnCost = 5;
            g.childEnergyFrac = 0.7;
            g.spawnCooldown = 4;
            g.size *= 1.5;
            g.lifespan = 40;
        },
    },
    /** More mass per individual, but slower and costlier to reproduce. */
    biggerBody: {
        id: 'biggerBody',
        cost: 3,
        name: 'Bigger Body',
        text: 'More biomass each; slower, and costlier to reproduce.',
        apply(g) {
            g.size *= 1.6;
            g.upkeep *= 1.3;
            g.spawnCost *= 1.4;
            g.moveSpeed *= 0.85;
        },
    },
    /** Chase down food and prey, at an energy cost. */
    fast: {
        id: 'fast',
        cost: 2,
        name: 'Fleet',
        text: 'Move faster to reach food and prey; costs a little energy.',
        apply(g) {
            g.moveSpeed *= 1.5;
            g.upkeep += 0.05;
        },
    },
    /** Cheap to run, but grazes light more slowly. */
    efficient: {
        id: 'efficient',
        cost: 2,
        name: 'Efficient',
        text: 'Low upkeep — survive lean times — but harvest a little slower.',
        apply(g) {
            g.upkeep *= 0.7;
            g.harvestRate *= 0.85;
        },
    },
    /** Breed fast from small, cheap bodies. */
    prolific: {
        id: 'prolific',
        cost: 3,
        name: 'Prolific',
        text: 'Reproduce faster from smaller, cheaper bodies.',
        apply(g) {
            g.spawnCooldown *= 0.6;
            g.spawnCost *= 0.85;
            g.size *= 0.9;
        },
    },
    /** Sense food, prey, and threats from farther away. */
    keenSenses: {
        id: 'keenSenses',
        cost: 2,
        name: 'Keen Senses',
        text: 'Sense prey and predators from farther away.',
        apply(g) {
            g.visionRadius += 8;
        },
    },
    /** Live longer to compound, at a small upkeep cost. */
    longLived: {
        id: 'longLived',
        cost: 2,
        name: 'Long-Lived',
        text: 'Live longer and compound growth; slightly higher upkeep.',
        apply(g) {
            g.lifespan *= 1.6;
            g.upkeep += 0.03;
        },
    },
} satisfies Record<string, Card>;

/** All cards as an array (draft/AI use). */
export const CARD_LIST: readonly Card[] = Object.values(CARDS);
