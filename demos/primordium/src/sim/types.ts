/**
 * Minimal caste + world configuration for the sim milestones.
 *
 * A caste is a compiled genome: the derived, per-organism behavior parameters the
 * hot loop reads. The card/genome layer that *produces* these values comes later.
 * Keeping this a plain data record is deliberate — it's what a compiled genome will
 * fill in.
 */
export interface Caste {
    /** Display/debug label. */
    name: string;
    /**
     * How the caste feeds. `photo` consumes the light field where it stands,
     * `carnivore` eats other organisms it can overpower, and `omnivore` does
     * both (typically worse at each than a specialist).
     */
    metabolism: 'photo' | 'carnivore' | 'omnivore';
    /** Max movement speed (world units / second). */
    moveSpeed: number;
    /** Energy drained per second just to stay alive. */
    upkeep: number;
    /** Max light consumed per second when standing on a full-light spot (photo). */
    harvestRate: number;
    /**
     * Light level at which grazing runs at half {@link harvestRate} (photo).
     *
     * Feeding saturates rather than scaling linearly: intake is
     * `harvestRate * light / (light + harvestHalfSat)`. Without this an
     * organism strips whatever cell it stands on to zero, so the population
     * grows until the *entire* field is bare and everything lives at
     * subsistence — a uniform famine mat. With it, intake falls off as a patch
     * thins, so grazers abandon thin ground before scouring it and the field
     * settles at a visible, patchy equilibrium.
     *
     * The equilibrium light level is set by the `harvestRate / upkeep` ratio:
     * `L* = upkeep * harvestHalfSat / (harvestRate - upkeep)`. A caste that
     * harvests far faster than it burns drives the field near zero regardless
     * of this value, so keep that ratio modest (~2x) for a lush world.
     */
    harvestHalfSat: number;
    /** Energy gained per unit of resource consumed (photo). */
    conversion: number;
    /** Offset (world units) used to estimate the light gradient for steering. */
    visionStep: number;
    /**
     * Radius (world units) at which the caste senses others — prey to hunt
     * (carnivore) or predators to flee (prey).
     */
    visionRadius: number;
    /** Contact distance (world units) within which a carnivore can eat prey. */
    reach: number;
    /** Energy gained per unit of prey body size when eating (carnivore). */
    killEnergy: number;
    /** Seconds between attacks (carnivore). */
    attackCooldown: number;
    /**
     * Energy at/above which a carnivore stops hunting (carnivore).
     *
     * Without satiation a predator kills every time prey is in reach and its
     * cooldown is up — a kill rate set by geometry rather than by hunger, which
     * is orders of magnitude above what it needs to live and strips the map of
     * prey. Sated predators ignoring prey is what produces real predator-prey
     * cycles: they thin the herd, fill up, coast while prey recovers.
     */
    huntSatiation: number;
    /** Fraction of a random-direction jitter added to steering (0 = none). */
    wander: number;
    /** Energy at/above which the organism will reproduce. */
    spawnThreshold: number;
    /** Energy spent to produce one offspring. */
    spawnCost: number;
    /** Fraction of `spawnCost` the offspring starts with. */
    childEnergyFrac: number;
    /** Seconds between reproductions. */
    spawnCooldown: number;
    /** Age (seconds) at which the organism dies. */
    lifespan: number;
    /** Body mass; biomass = sum of this over living organisms. */
    size: number;
    /**
     * Armour: added to body size only when deciding whether something can eat
     * this organism. Lets a caste price itself out of a predator's menu without
     * inflating the mass it scores, so defence is a real choice rather than a
     * side effect of getting bigger.
     */
    defense: number;
    /**
     * Energy the *eater* loses per unit of this organism's size when it eats
     * one. High enough and eating you costs more than you are worth, which
     * makes a caste effectively inedible without needing armour.
     */
    toxicity: number;
    /**
     * How strongly this caste steers toward nearby organisms of its own caste.
     * Herding pulls a population into visible flocks instead of an even spread,
     * and concentrates its grazing pressure.
     */
    cohesion: number;
    /**
     * Multiplier on this caste's own size when judging what it can overpower.
     * 1 means it can only eat things strictly smaller; above 1 lets it punch
     * above its weight and take on peers.
     */
    preyReach: number;
    /**
     * Fraction of a target's armour this caste ignores when judging what it can
     * overpower (0 = armour fully counts, 1 = armour is irrelevant). The
     * counter-play to {@link defense}, so a defensive stack is an arms race
     * rather than an unanswerable wall.
     */
    armorPiercing: number;
    /**
     * Multiplier on the crowding cost this caste pays (1 = normal, lower =
     * tolerates its own density). Herding animals huddle by design, so without
     * this a cohesion card would simply bill a flock for being a flock and make
     * herding strictly self-defeating.
     */
    crowdTolerance: number;
    /** Radius offspring are scattered within (world units). */
    spawnDispersal: number;
    /**
     * Energy below which the organism goes dormant: it stops moving and
     * reproducing and its upkeep drops to `upkeep * dormancyUpkeep`. 0 disables
     * dormancy. A way to ride out famine instead of dying in it.
     */
    dormancyAt: number;
    /** Upkeep multiplier while dormant (see {@link dormancyAt}). */
    dormancyUpkeep: number;
}

/** World + field configuration for one match. */
export interface EcosystemConfig {
    /** Square world edge length (world units). */
    worldSize: number;
    /** Field lattice resolution (cols = rows). */
    fieldCells: number;
    /** Starting light in every cell. */
    lightInitial: number;
    /** Max light a cell regenerates to. */
    lightCap: number;
    /** Light regenerated per cell per second. */
    lightRegen: number;
    /** Max organisms (SoA array size). */
    capacity: number;
    /** Fixed timestep (seconds). */
    dt: number;
    /**
     * Multiplier on every caste's reproduction cooldown. >1 slows growth (longer
     * doubling time) without lowering carrying capacity, so a big world fills
     * gradually instead of being blanketed in seconds. Default 1.
     */
    reproCooldownScale?: number;
    /**
     * Light returned to the field per unit of body size when an organism dies.
     *
     * Closes the nutrient loop: a herd that grazes an area bare and then dies
     * there enriches it for whatever comes next, so the map develops a history
     * instead of only ever being depleted. 0 (default) disables it.
     */
    corpseFertility?: number;
    /**
     * Extra upkeep per close neighbour, as a fraction of the caste's own upkeep.
     *
     * Density dependence, and the main thing stopping one lineage from paving
     * the map. Without it the species with the lowest break-even light level
     * wins *everything* — competitive exclusion — because nothing penalises
     * packing more bodies into the same ground. Crowding makes each additional
     * neighbour cost something, which caps local density and lets several
     * lineages coexist. 0 (default) disables it.
     */
    crowdingPenalty?: number;
}

/**
 * A photosynthetic self-multiplier — the "dumb bloom" base caste.
 *
 * Tuned for a *macro* ecosystem: few, large, long-lived grazers rather than a
 * dense mat of tiny ones. Three ratios do the work, and they are what to keep
 * hold of when retuning:
 *
 * - `upkeep` sets the standing population. At equilibrium the world's whole
 *   light regen is spent on upkeep, so `population ≈ totalLightRegen / upkeep`.
 * - `harvestRate / upkeep` sets how lush the world looks. Keep it near 2 so
 *   the field settles around 40% of cap (visibly patchy). Crank it and grazers
 *   strip the map to bare rock and live at subsistence.
 * - `size` is mass (and score); it drives both biomass and the predation
 *   size ladder.
 */
export const PHOTO_CASTE: Caste = {
    name: 'Bloom',
    metabolism: 'photo',
    moveSpeed: 9,
    // Upkeep sets the standing population against the world's light budget.
    // Harvest is kept comfortably above it (~2.8x) so the surplus a grazer
    // breeds on is not a knife-edge difference of two similar numbers — when
    // it is, any card that nudges either side decides the whole match.
    upkeep: 1.2,
    harvestRate: 5,
    harvestHalfSat: 1.2,
    conversion: 1,
    visionStep: 8,
    visionRadius: 26,
    reach: 0,
    killEnergy: 0,
    attackCooldown: 0,
    huntSatiation: 0,
    wander: 0.25,
    spawnThreshold: 18,
    spawnCost: 11.5,
    childEnergyFrac: 0.75,
    spawnCooldown: 6,
    lifespan: 90,
    size: 4,
    defense: 0,
    toxicity: 0,
    cohesion: 0,
    preyReach: 1,
    armorPiercing: 0,
    crowdTolerance: 1,
    spawnDispersal: 2,
    dormancyAt: 0,
    dormancyUpkeep: 1,
};

/** A carnivore that hunts and eats smaller organisms — the predator caste. */
export const CARNIVORE_CASTE: Caste = {
    name: 'Fang',
    metabolism: 'carnivore',
    // Only a shade faster than the grazers it hunts (9) — a predator that
    // simply outruns its prey turns the map into a kill box.
    moveSpeed: 10.4,
    upkeep: 2.2,
    harvestRate: 0,
    harvestHalfSat: 0,
    conversion: 0,
    visionStep: 8,
    visionRadius: 38,
    reach: 3.5,
    killEnergy: 10,
    attackCooldown: 2.5,
    huntSatiation: 48,
    wander: 0.25,
    spawnThreshold: 48,
    spawnCost: 30,
    childEnergyFrac: 0.7,
    spawnCooldown: 10,
    lifespan: 110,
    size: 6,
    defense: 0,
    toxicity: 0,
    cohesion: 0,
    preyReach: 1,
    armorPiercing: 0,
    crowdTolerance: 1,
    spawnDispersal: 3,
    dormancyAt: 0,
    dormancyUpkeep: 1,
};

/**
 * Neutral background wildlife: tiny photosynthetic critters owned by no faction.
 * They give predators a food source independent of the player species, so a
 * predator isn't forced to attack factions just to survive. Small enough that any
 * carnivore can eat them.
 */
export const WILDLIFE_CASTE: Caste = {
    name: 'Wildlife',
    metabolism: 'photo',
    moveSpeed: 7,
    // Survives on thinner ground than the factions (lower harvest-to-upkeep
    // break-even), so it persists at the margins as a food source for
    // predators instead of being competed to extinction.
    upkeep: 0.8,
    harvestRate: 2.6,
    harvestHalfSat: 1.2,
    conversion: 1,
    visionStep: 6,
    visionRadius: 20,
    reach: 0,
    killEnergy: 0,
    attackCooldown: 0,
    huntSatiation: 0,
    wander: 0.35,
    // Wildlife does NOT reproduce (unreachable threshold) — it's a stable
    // background kept topped up by a spawner (see MatchController), so it never
    // blooms. It mostly leaves the map by being eaten.
    spawnThreshold: Number.POSITIVE_INFINITY,
    spawnCost: 8,
    childEnergyFrac: 0.75,
    spawnCooldown: 2,
    lifespan: 240,
    // Well under the base grazer (4) and predator (6), so anything that hunts
    // can eat it.
    size: 1.5,
    defense: 0,
    toxicity: 0,
    cohesion: 0,
    preyReach: 1,
    armorPiercing: 0,
    crowdTolerance: 1,
    spawnDispersal: 2,
    dormancyAt: 0,
    dormancyUpkeep: 1,
};

/**
 * Default world tuned so a single bloom rises and then hits carrying capacity.
 *
 * Two field knobs shape the ecosystem independently, which is what lets the
 * world be both lush-looking and sparsely populated:
 *
 * - `lightCap` is how rich one patch gets, and therefore how fast a grazer
 *   standing on good ground can feed. It sets the *ceiling* on upkeep a caste
 *   can sustain.
 * - `lightRegen * fieldCells²` is the whole world's energy budget per second,
 *   and with upkeep it sets the standing population
 *   (`population ≈ totalRegen / upkeep`).
 *
 * Raising the cap without raising regen buys richer patches and healthier
 * margins without adding organisms.
 */
export const DEFAULT_CONFIG: EcosystemConfig = {
    worldSize: 200,
    fieldCells: 64,
    lightInitial: 2,
    lightCap: 2,
    lightRegen: 0.1,
    capacity: 20000,
    dt: 1 / 30,
};
