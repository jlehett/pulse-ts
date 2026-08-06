import { CARNIVORE_CASTE, PHOTO_CASTE } from './types';
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
            g.harvestHalfSat = 0;
            g.conversion = 0;
            g.reach = CARNIVORE_CASTE.reach;
            g.killEnergy = CARNIVORE_CASTE.killEnergy;
            g.attackCooldown = CARNIVORE_CASTE.attackCooldown;
            g.huntSatiation = CARNIVORE_CASTE.huntSatiation;
            g.visionRadius = Math.max(
                g.visionRadius,
                CARNIVORE_CASTE.visionRadius,
            );
            g.moveSpeed *= 1.15;
            g.upkeep *= 1.6;
            g.spawnThreshold = CARNIVORE_CASTE.spawnThreshold;
            g.spawnCost = CARNIVORE_CASTE.spawnCost;
            g.childEnergyFrac = CARNIVORE_CASTE.childEnergyFrac;
            g.spawnCooldown = CARNIVORE_CASTE.spawnCooldown;
            g.size *= 1.5;
            g.lifespan = CARNIVORE_CASTE.lifespan;
        },
    },
    /** More mass per individual, but mass costs more than it earns. */
    biggerBody: {
        id: 'biggerBody',
        cost: 3,
        name: 'Bigger Body',
        text: 'Twice the mass each, and too big to be prey — but mass is hungry, so far fewer of you.',
        apply(g) {
            // A bigger body burns more but also gathers more, so it stays
            // metabolically viable (roughly neutral on harvest-to-upkeep).
            // What it really trades is *numbers* for *mass and safety*: far
            // costlier to reproduce, but heavy enough to price itself out of a
            // predator's prey list.
            g.size *= 1.6;
            g.upkeep *= 1.35;
            g.harvestRate *= 1.25;
            g.spawnCost *= 1.5;
            g.spawnThreshold *= 1.4;
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
        text: 'Low upkeep — survive lean times — but harvest markedly slower.',
        apply(g) {
            // Upkeep is the strongest stat in the game — it divides into the
            // world's light budget to set how many of you the map supports — so
            // this discount stays modest, and the harvest cut roughly matches
            // it. Cheap upkeep with near-full harvest wins every match.
            g.upkeep *= 0.82;
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
