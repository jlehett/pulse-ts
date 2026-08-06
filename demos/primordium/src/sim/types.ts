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
     * How the caste feeds. `photo` consumes the light field where it stands;
     * `carnivore` eats other organisms smaller than itself.
     */
    metabolism: 'photo' | 'carnivore';
    /** Max movement speed (world units / second). */
    moveSpeed: number;
    /** Energy drained per second just to stay alive. */
    upkeep: number;
    /** Max light consumed per second when standing on a full-light spot (photo). */
    harvestRate: number;
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
}

/** A photosynthetic self-multiplier — the "dumb bloom" base caste. */
export const PHOTO_CASTE: Caste = {
    name: 'Bloom',
    metabolism: 'photo',
    moveSpeed: 6,
    upkeep: 0.15,
    harvestRate: 1.5,
    conversion: 1,
    visionStep: 4,
    visionRadius: 12,
    reach: 0,
    killEnergy: 0,
    attackCooldown: 0,
    wander: 0.3,
    spawnThreshold: 3,
    spawnCost: 2,
    childEnergyFrac: 0.75,
    spawnCooldown: 2,
    lifespan: 30,
    size: 1,
};

/** A carnivore that hunts and eats smaller organisms — the predator caste. */
export const CARNIVORE_CASTE: Caste = {
    name: 'Fang',
    metabolism: 'carnivore',
    moveSpeed: 8,
    upkeep: 0.25,
    harvestRate: 0,
    conversion: 0,
    visionStep: 4,
    visionRadius: 22,
    reach: 2.5,
    killEnergy: 6,
    attackCooldown: 1,
    wander: 0.25,
    spawnThreshold: 8,
    spawnCost: 5,
    childEnergyFrac: 0.7,
    spawnCooldown: 4,
    lifespan: 40,
    size: 1.5,
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
    moveSpeed: 5,
    upkeep: 0.1,
    harvestRate: 1,
    conversion: 1,
    visionStep: 4,
    visionRadius: 14,
    reach: 0,
    killEnergy: 0,
    attackCooldown: 0,
    wander: 0.35,
    // Wildlife does NOT reproduce (unreachable threshold) — it's a stable
    // background kept topped up by a spawner (see MatchController), so it never
    // blooms. It mostly leaves the map by being eaten.
    spawnThreshold: Number.POSITIVE_INFINITY,
    spawnCost: 2,
    childEnergyFrac: 0.75,
    spawnCooldown: 2,
    lifespan: 240,
    size: 0.5,
};

/** Default world tuned so a single bloom rises and then hits carrying capacity. */
export const DEFAULT_CONFIG: EcosystemConfig = {
    worldSize: 200,
    fieldCells: 64,
    lightInitial: 1,
    lightCap: 1,
    lightRegen: 0.05,
    capacity: 20000,
    dt: 1 / 30,
};
