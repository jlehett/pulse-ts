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
    /**
     * Which part of the organism this card rewrites. Purely for presentation —
     * the pool is large enough that an ungrouped list is unreadable at a glance.
     */
    branch: CardBranch;
    /** Mutate the genome draft in place. Applied in deck order at compile time. */
    apply(g: Caste): void;
}

/** Presentation grouping for the card pool. */
export type CardBranch =
    | 'metabolism'
    | 'body'
    | 'senses'
    | 'reproduction'
    | 'survival'
    | 'social';

/** Display order and labels for the branches, for the evolve panel. */
export const CARD_BRANCHES: readonly { id: CardBranch; label: string }[] = [
    { id: 'metabolism', label: 'Metabolism' },
    { id: 'body', label: 'Body' },
    { id: 'senses', label: 'Senses & Speed' },
    { id: 'reproduction', label: 'Reproduction' },
    { id: 'survival', label: 'Survival' },
    { id: 'social', label: 'Social' },
];

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
 * The card pool. Every card is a capability or a real tradeoff — never a pure
 * upgrade — and each one gives up something a different strategy would want.
 *
 * The pool is deliberately built around the *ladder* mechanics rather than raw
 * stat lines: who can eat whom (size, armour, toxicity, prey reach), how a
 * population is shaped in space (herding, dispersal), and how it survives a bad
 * season (dormancy, longevity). Cards that only nudge a number are the minority.
 */
export const CARDS = {
    // --- Metabolism: how you get energy at all ---------------------------
    /** Become a carnivore: hunt and eat smaller organisms, but lose photosynthesis. */
    predation: {
        id: 'predation',
        cost: 4,
        name: 'Predation',
        branch: 'metabolism',
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
    /** Eat both ways — never starving, never excelling. */
    omnivore: {
        id: 'omnivore',
        cost: 4,
        name: 'Omnivore',
        branch: 'metabolism',
        text: 'Graze AND hunt. Neither well, and the double machinery is expensive.',
        apply(g) {
            g.metabolism = 'omnivore';
            g.reach = CARNIVORE_CASTE.reach;
            // Meat is a supplement, not a living: worth about half what a true
            // carnivore extracts from the same carcass.
            g.killEnergy = CARNIVORE_CASTE.killEnergy * 0.5;
            g.attackCooldown = CARNIVORE_CASTE.attackCooldown * 1.4;
            g.huntSatiation = g.spawnThreshold;
            g.harvestRate *= 0.88;
            g.spawnCost *= 1.2;
            g.visionRadius *= 1.2;
        },
    },
    /** Feed on ground too thin for anyone else. */
    deepRoots: {
        id: 'deepRoots',
        cost: 3,
        name: 'Deep Roots',
        branch: 'metabolism',
        text: 'Feed almost as well on bare ground as on rich — but you are slow and rooted.',
        apply(g) {
            // Halving half-saturation is what lets it live where the field has
            // already been grazed out from under everyone else.
            g.harvestHalfSat *= 0.62;
            g.harvestRate *= 0.9;
            g.moveSpeed *= 0.85;
            g.spawnCooldown *= 1.3;
        },
    },
    /** Chase the light aggressively. */
    sunseeker: {
        id: 'sunseeker',
        cost: 2,
        name: 'Sunseeker',
        branch: 'metabolism',
        text: 'Read the light from much further off and harvest hard where it is richest.',
        apply(g) {
            g.visionStep *= 1.8;
            g.harvestRate *= 1.22;
            g.spawnCooldown *= 1.22;
        },
    },

    // --- Body: mass, armour, chemistry ------------------------------------
    /** More mass per individual, but mass costs more than it earns. */
    biggerBody: {
        id: 'biggerBody',
        cost: 3,
        name: 'Bigger Body',
        branch: 'body',
        text: 'Half again the mass each, and heavy enough to price yourself off some menus.',
        apply(g) {
            // A bigger body burns more but also gathers more, so it stays
            // metabolically viable (roughly neutral on harvest-to-upkeep).
            // What it really trades is *numbers* for *mass and safety*.
            g.size *= 1.6;
            g.upkeep *= 1.52;
            g.harvestRate *= 1.4;
            g.spawnCost *= 1.5;
            g.spawnThreshold *= 1.4;
            g.moveSpeed *= 0.85;
        },
    },
    /** Shed mass for numbers. */
    dwarfism: {
        id: 'dwarfism',
        cost: 2,
        name: 'Dwarfism',
        branch: 'body',
        text: 'Tiny and cheap — many more of you, but you are on everybody’s menu.',
        apply(g) {
            // Harvest shrinks with upkeep. Cutting upkeep alone would hand this
            // card the lowest break-even light level in the game, and the
            // lowest break-even simply excludes everyone else from the map.
            g.size *= 0.65;
            g.upkeep *= 0.66;
            g.harvestRate *= 0.66;
            g.spawnCost *= 0.62;
            g.spawnThreshold *= 0.62;
        },
    },
    /** Armour that deters predators without adding scoring mass. */
    carapace: {
        id: 'carapace',
        cost: 3,
        name: 'Carapace',
        branch: 'body',
        text: 'A shell that counts as bulk to predators only — heavy to haul, worth nothing on the scoreboard.',
        apply(g) {
            g.defense += g.size * 0.9;
            g.moveSpeed *= 0.88;
            g.spawnCost *= 1.45;
            g.spawnCooldown *= 1.15;
        },
    },
    /** Make yourself a bad meal. */
    toxicFlesh: {
        id: 'toxicFlesh',
        cost: 3,
        name: 'Toxic Flesh',
        branch: 'body',
        text: 'Eating you costs more than you are worth. Brewing the poison costs you too.',
        apply(g) {
            // Above a predator's killEnergy, so a kill is a net energy *loss*.
            g.toxicity += CARNIVORE_CASTE.killEnergy * 1.15;
            // Paid in provisioning, not upkeep. A metabolic tax would drop this
            // caste's carrying capacity the instant the card is played, below
            // the population already standing on the map — which starves it en
            // masse at the very moment it evolves.
            g.spawnCost *= 1.4;
            g.spawnCooldown *= 1.12;
        },
    },
    /** Punch above your weight. */
    apexJaws: {
        id: 'apexJaws',
        cost: 4,
        name: 'Apex Jaws',
        branch: 'body',
        text: 'Bring down prey half again your own weight — but each kill is slow, brutal work.',
        apply(g) {
            g.preyReach *= 1.55;
            g.attackCooldown *= 1.5;
        },
    },

    /** Kill far above your weight class, slowly. */
    venom: {
        id: 'venom',
        cost: 4,
        name: 'Venom',
        branch: 'body',
        text: 'Poison fells prey no size could — but the toxin is slow, and you wait between kills.',
        apply(g) {
            g.preyReach *= 1.7;
            g.attackCooldown *= 2.2;
            g.killEnergy *= 1.35;
        },
    },
    /** Strip the armour off well-defended prey. */
    shellCracker: {
        id: 'shellCracker',
        cost: 3,
        name: 'Shell Cracker',
        branch: 'body',
        text: 'Crush armour outright — plating no longer protects your prey from you.',
        apply(g) {
            g.armorPiercing = 1;
            g.attackCooldown *= 1.35;
            g.moveSpeed *= 0.9;
        },
    },

    // --- Senses & speed ---------------------------------------------------
    /** Chase down food and prey, at an energy cost. */
    fast: {
        id: 'fast',
        cost: 2,
        name: 'Fleet',
        branch: 'senses',
        text: 'Move faster to reach food and prey; costs a little energy.',
        apply(g) {
            g.moveSpeed *= 1.35;
            g.spawnCooldown *= 1.12;
        },
    },
    /** Sense food, prey, and threats from farther away. */
    keenSenses: {
        id: 'keenSenses',
        cost: 2,
        name: 'Keen Senses',
        branch: 'senses',
        text: 'Sense prey and predators from farther away.',
        apply(g) {
            g.visionRadius += 12;
        },
    },
    /** Bolt at the first hint of danger. */
    skittish: {
        id: 'skittish',
        cost: 2,
        name: 'Skittish',
        branch: 'senses',
        text: 'See danger early and bolt — but you never settle long enough to feed well.',
        apply(g) {
            g.visionRadius *= 1.6;
            g.moveSpeed *= 1.1;
            g.wander += 0.35;
            g.spawnCooldown *= 1.25;
        },
    },
    /** Lie in wait rather than chase. */
    ambusher: {
        id: 'ambusher',
        cost: 3,
        name: 'Ambusher',
        branch: 'senses',
        text: 'Barely move, strike from much further, and take far more from every kill.',
        apply(g) {
            g.moveSpeed *= 0.55;
            g.reach *= 2.6;
            g.killEnergy *= 1.6;
            g.visionRadius *= 0.8;
            g.spawnCooldown *= 1.15;
        },
    },

    // --- Reproduction -----------------------------------------------------
    /** Breed fast from small, cheap bodies. */
    prolific: {
        id: 'prolific',
        cost: 3,
        name: 'Prolific',
        branch: 'reproduction',
        text: 'Reproduce faster from smaller, cheaper bodies.',
        apply(g) {
            g.spawnCooldown *= 0.72;
            g.spawnCost *= 0.88;
        },
    },
    /** Throw offspring far from home. */
    windborneSpores: {
        id: 'windborneSpores',
        cost: 3,
        name: 'Windborne Spores',
        branch: 'reproduction',
        text: 'Fling young clear across the map to claim fresh ground — most land badly.',
        apply(g) {
            g.spawnDispersal = 90;
            g.childEnergyFrac *= 0.6;
            g.spawnCooldown *= 0.85;
        },
    },
    /** Fewer, better-provisioned young. */
    liveYoung: {
        id: 'liveYoung',
        cost: 3,
        name: 'Live Young',
        branch: 'reproduction',
        text: 'Young are born nearly self-sufficient, but each one is a serious investment.',
        apply(g) {
            g.childEnergyFrac = Math.min(0.95, g.childEnergyFrac * 1.35);
            g.spawnCost *= 1.45;
            g.spawnCooldown *= 1.3;
        },
    },
    /** Empty yourself into a burst of young. */
    broodSwarm: {
        id: 'broodSwarm',
        cost: 3,
        name: 'Brood Swarm',
        branch: 'reproduction',
        text: 'Breed in rapid bursts once you are fat enough — and you must get very fat first.',
        apply(g) {
            g.spawnCooldown *= 0.5;
            g.spawnThreshold *= 1.7;
            g.childEnergyFrac *= 0.85;
        },
    },

    // --- Survival ---------------------------------------------------------
    /** Cheap to run, but grazes light more slowly. */
    efficient: {
        id: 'efficient',
        cost: 2,
        name: 'Efficient',
        branch: 'survival',
        text: 'Low upkeep — survive lean times — but harvest markedly slower.',
        apply(g) {
            // Upkeep is the strongest stat in the game — it divides into the
            // world's light budget to set how many of you the map supports — so
            // this discount stays modest, and the harvest cut roughly matches
            // it. Cheap upkeep with near-full harvest wins every match.
            // Cheap upkeep means MORE of you, and more of you is more biomass.
            // Size has to come down with it or this is a free score multiplier.
            g.upkeep *= 0.85;
            g.harvestRate *= 0.88;
            g.size *= 0.87;
        },
    },
    /** Live longer to compound, at the cost of breeding pace. */
    longLived: {
        id: 'longLived',
        cost: 2,
        name: 'Long-Lived',
        branch: 'survival',
        text: 'Live far longer and compound your growth; slower to breed.',
        apply(g) {
            g.lifespan *= 1.6;
            g.spawnCooldown *= 1.1;
        },
    },
    /** Shut down instead of starving. */
    dormancy: {
        id: 'dormancy',
        cost: 3,
        name: 'Dormancy',
        branch: 'survival',
        text: 'When starving, shut down and wait it out — blind, still, and barren until fed.',
        apply(g) {
            g.dormancyAt = g.spawnThreshold * 0.3;
            g.dormancyUpkeep = 0.15;
            g.spawnCooldown *= 1.2;
        },
    },
    /** Tough and slow-burning. */
    hardy: {
        id: 'hardy',
        cost: 3,
        name: 'Hardy',
        branch: 'survival',
        text: 'Thick-skinned and long-lived, but slow to breed and slower to move.',
        apply(g) {
            g.defense += g.size * 0.4;
            g.lifespan *= 1.35;
            g.spawnCooldown *= 1.35;
            g.moveSpeed *= 0.9;
        },
    },

    // --- Social -----------------------------------------------------------
    /** Gather into flocks. */
    herdInstinct: {
        id: 'herdInstinct',
        cost: 2,
        name: 'Herd Instinct',
        branch: 'social',
        text: 'Gather into tight flocks — safety and presence, but you graze each other out.',
        apply(g) {
            g.cohesion += 0.9;
            // A flock has to tolerate its own density, or cohesion just bills
            // you for huddling and the card is strictly self-defeating.
            g.crowdTolerance *= 0.45;
            // The real cost of flocking is emergent: a tight flock crowds its
            // own ground and pays the density penalty for it.
            g.spawnCooldown *= 1.12;
        },
    },
    /** Hunt as a coordinated group. */
    packHunter: {
        id: 'packHunter',
        cost: 3,
        name: 'Pack Hunter',
        branch: 'social',
        text: 'Hunt in coordinated packs: strike more often, and together bring down bigger game.',
        apply(g) {
            g.cohesion += 0.8;
            g.crowdTolerance *= 0.55;
            g.attackCooldown *= 0.5;
            // The pack is the cheapest rung on the punch-above-your-weight
            // ladder, and it stacks multiplicatively with the others.
            g.preyReach *= 1.3;
            g.visionRadius *= 1.2;
        },
    },
    /** Spread out and take the whole map. */
    solitary: {
        id: 'solitary',
        cost: 2,
        name: 'Solitary',
        branch: 'social',
        text: 'Shun your own kind and spread thin over fresh ground; nobody comes to help.',
        apply(g) {
            g.cohesion = 0;
            g.crowdTolerance *= 1.15; // spread thin, so crowding bites harder
            g.spawnDispersal = Math.max(g.spawnDispersal, 26);
            g.harvestRate *= 1.05;
            g.visionRadius *= 0.85;
        },
    },
} satisfies Record<string, Card>;

/** All cards as an array (draft/AI use). */
export const CARD_LIST: readonly Card[] = Object.values(CARDS);
