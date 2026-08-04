/**
 * Pure data types for Overclock's game content. No engine imports — these
 * describe the roster, traits, augments, events and enemy waves that the
 * run layer and combat sim consume.
 */

/** The trait axes a construct can carry. */
export type TraitAxis = 'manufacturer' | 'role' | 'prime';

/** Identifier unions keep content references typo-safe. */
export type ManufacturerId =
    | 'aegisline'
    | 'redline'
    | 'blacksite'
    | 'blastworks'
    | 'hardlight'
    | 'vulture'
    | 'surgecore';

export type RoleId =
    | 'turret'
    | 'flanker'
    | 'bulwark'
    | 'juggernaut'
    | 'breaker'
    | 'reaper'
    | 'medic'
    | 'bombardier'
    | 'amplifier';

/**
 * Unique traits carried by Prime (cost-5) constructs. Each is owned by
 * exactly one unit and is always active while that unit is fielded.
 */
export type PrimeId =
    | 'iris'
    | 'zero-day'
    | 'emplacement'
    | 'guardian-protocol'
    | 'adaptive-core'
    | 'bladeform';

export type TraitId = ManufacturerId | RoleId | PrimeId;

/**
 * Gameplay archetypes — the combat profile a unit fills, independent of its
 * traits (a Bulwark-trait unit is usually a Tank, but not always). Shown as
 * an informational tag on cards; also selects the unit's mana profile.
 */
export type ArchetypeId =
    | 'tank'
    | 'fighter'
    | 'assassin'
    | 'marksman'
    | 'caster'
    | 'support'
    | 'specialist';

/** How a unit's mana charges during combat. */
export interface ManaProfile {
    /** Mana gained per auto-attack. */
    perAttack: number;
    /** Mana gained per point of post-mitigation damage taken. */
    perDamage: number;
    /** Cap on mana gained from any single hit taken. */
    perHitCap: number;
}

/** An archetype definition (informational tag + mana profile). */
export interface ArchetypeDef {
    id: ArchetypeId;
    name: string;
    /** What the archetype does and which stats it cares about. */
    description: string;
    mana: ManaProfile;
}

/** A single activation breakpoint of a trait. */
export interface TraitTier {
    /** Unique units of this trait required to activate the tier. */
    count: number;
    /** Human description of the effect at this tier. */
    effect: string;
}

/** A trait definition (one entry on any axis). */
export interface TraitDef {
    id: TraitId;
    axis: TraitAxis;
    name: string;
    /** Flavor line shown in tooltips. */
    description: string;
    /** Accent color for UI chips. */
    color: string;
    /** Activation breakpoints, ascending by count. */
    tiers: TraitTier[];
}

/**
 * A scaled ability (or item) magnitude. The combat sim resolves it as:
 *
 * `(starScale(base) + adRatio·ATK + armorRatio·Armor + hpRatio·maxHP)
 *  × (apScaled ? AP : 1)`
 *
 * ATK and max HP already grow with star level, so ratio-driven portions
 * inherit star scaling; `base` is star-scaled explicitly. Armor does not
 * star-scale by design. AP (ability power) is a multiplier starting at
 * 100% that items and effects raise.
 */
export interface Scaling {
    /** Flat portion, star-scaled. */
    base?: number;
    /** Added fraction of the caster's current attack damage. */
    adRatio?: number;
    /** Added fraction of the caster's armor. */
    armorRatio?: number;
    /** Added fraction of the caster's max HP. */
    hpRatio?: number;
    /** Whether the whole resolved value is multiplied by the caster's AP. */
    apScaled?: boolean;
}

/**
 * Ability behavior archetypes implemented by the combat sim.
 *
 * `power` (and `secondary` where noted) are {@link Scaling} magnitudes;
 * `aux`/`aux2` stay plain parameters (radii, counts, durations, fractions).
 */
export type AbilityKind =
    | 'strike' // heavy hit on current target
    | 'nova' // AoE around self (aux = radius; aux2 = self-heal fraction)
    | 'blast' // AoE on the target (aux = radius; aux2 = mana burned)
    | 'bounce' // 1-hex blast; a second blast hits a random enemy at aux
    | 'triage' // heal lowest ally power; their neighbors heal secondary
    | 'echo' // hit + Discord (aux) the target, repeat on nearest other
    | 'summon' // deploy a sentry token (power = its HP) adjacent
    | 'flicker' // blink strike; kills recast on the nearest enemy
    | 'phantom' // blink strike; a kill refunds aux fraction of max mana
    | 'drain' // hit target power; heal the lowest-HP ally secondary
    | 'concussive' // aux shells on random enemies; hits slow aux2 AS 2s
    | 'barrage' // aux missiles on random enemies; the last deals double
    | 'sweep' // channel aux seconds, raking power/tick across the arena
    | 'snipe' // pierce to the farthest enemy (+ distance scaling on it)
    | 'aura' // power.base secs: allies in 2 hexes +aux·AP AS,
    //          enemies -aux2 AS
    | 'hook' // drag the farthest enemy adjacent, then hit it
    | 'cleanse' // heal the aux lowest allies and strip their debuffs
    | 'overcharge' // next aux attacks: +power damage; aux2 = pierce flag
    | 'bastion' // hit target for power, shield self for secondary
    | 'ram' // line damage + knockback; aux2 = stun seconds
    | 'scorch' // nova (aux = radius) leaving a secondary/s burn DoT
    | 'reap' // 1-hex nova; executes enemies below aux·AP HP (capped)
    | 'rally' // heal the aux lowest allies and speed their attacks
    | 'empower' // heal the strongest ally power and grant +aux damage 5s
    | 'well' // pull enemies within aux hexes toward self and hit them
    | 'chain' // hit target for power; arc secondary to a nearby enemy
    | 'feast' // strike; kills permanently grant +aux ATK (stacking)
    | 'fortify' // permanently gain power armor; knock back adjacent foes
    | 'shockwave' // 1-hex nova dealing power (armor folded into scaling)
    | 'mark' // Discord (aux) the highest-ATK enemy power.base secs;
    //          allies striking it heal secondary
    | 'phalanx' // shield self and adjacent allies for power
    | 'devour' // bite for power, heal aux of damage dealt;
    //          kills grant +secondary max HP permanently
    | 'gauntlet' // aux secs: attacks +power flat and cleave to a second
    //          adjacent enemy at 60%
    | 'guillotine' // hit the lowest-HP enemy; kills recast (max aux)
    | 'rush' // dash through the farthest enemy, hitting its whole line
    | 'valkyrie' // heal all allies power and grant +aux damage for 4s
    | 'transcend' // aux seconds: allies unkillable, regen power HP/s
    | 'emp' // drain all enemy mana, silence aux secs,
    //          power.base·AP %current-HP damage (capped)
    | 'mimic'; // cast the copied ability at power.base× effectiveness

/** Parametrized ability attached to a unit. */
export interface AbilityDef {
    name: string;
    description: string;
    kind: AbilityKind;
    /**
     * Primary magnitude (damage, heal, shield, per-tick…). A few kinds
     * read only `power.base` raw (duration for 'aura'/'mark', fraction
     * for 'emp', multiplier for 'mimic'); see {@link AbilityKind}.
     */
    power: Scaling;
    /**
     * Second scaled magnitude where a kind has one (bastion shield,
     * triage splash, drain heal, chain arc, scorch burn/s, mark heal,
     * devour max-HP gain); see {@link AbilityKind}.
     */
    secondary?: Scaling;
    /** Plain parameter; meaning per kind is noted in {@link AbilityKind}. */
    aux?: number;
    /** Plain parameter; meaning per kind is noted in {@link AbilityKind}. */
    aux2?: number;
}

/** Base combat statistics of a 1-star unit. */
export interface UnitStats {
    hp: number;
    /** Damage per auto-attack. */
    atk: number;
    /** Attacks per second. */
    atkSpeed: number;
    /** Flat damage mitigation rating. */
    armor: number;
    /** Attack range in hexes (1 = melee). */
    range: number;
    /** Mana needed to cast. */
    manaMax: number;
    /** Mana at combat start. */
    manaStart: number;
}

/**
 * A construct (purchasable unit) definition.
 *
 * Standard constructs carry one manufacturer and one role. Prime constructs
 * (cost 5) instead carry a unique `prime` trait and no manufacturer/role —
 * they sit outside the trait web by design.
 */
export interface UnitDef {
    id: string;
    name: string;
    /** Shop cost in gold; also the unit's tier (1-5). */
    cost: 1 | 2 | 3 | 4 | 5;
    /** Manufacturer trait; absent on Prime constructs. */
    manufacturer?: ManufacturerId;
    /** Role trait; absent on Prime constructs. */
    role?: RoleId;
    /** Unique Prime trait; present only on Prime constructs. */
    prime?: PrimeId;
    /** Combat-profile tag (informational + mana profile); see {@link ArchetypeDef}. */
    archetype: ArchetypeId;
    /** Short flavor descriptor shown on cards ("Recon Skimmer"). */
    epithet: string;
    stats: UnitStats;
    ability: AbilityDef;
    /** True for enemy-only constructs that never appear in the shop. */
    enemyOnly?: boolean;
    /** True for summoned tokens (never in the shop, never counted for traits). */
    token?: boolean;
}

/** Flat stat bonuses granted by an equipped item. */
export interface ItemStats {
    /** Flat attack damage. */
    atk?: number;
    /** Ability-power bonus as a fraction (0.15 = +15% AP). */
    ap?: number;
    /** Attack-speed bonus as a fraction (0.15 = +15%). */
    atkSpeed?: number;
    /** Flat armor. */
    armor?: number;
    /** Flat max HP. */
    hp?: number;
    /** Flat starting mana. */
    mana?: number;
}

/**
 * Passive effect hooks implemented by the combat sim (`sim/items.ts`).
 * Each combined item carries exactly one.
 */
export type ItemEffectId =
    | 'railgun' // attacks pierce the hex behind the target
    | 'hybridActuator' // casts empower the next 3 attacks
    | 'overheat' // stacking AS; at cap, vent self-burn + AoE burn
    | 'kineticRam' // every 4th attack knocks back + slows
    | 'salvageClaws' // kills grant permanent ATK + heal
    | 'voltageSpike' // attacks burn mana, bonus damage per point
    | 'echoProcessor' // first cast repeats at reduced power
    | 'predictiveTargeting' // casts grant attack speed
    | 'firewallMatrix' // casts shield; attackers hitting it are Discorded
    | 'repairSubroutine' // casts also heal the holder
    | 'overclockKernel' // casts grant permanent stacking AP
    | 'gatling' // large AS bonus, attacks deal less damage
    | 'bunkerServos' // stacking armor + AS while never having moved
    | 'momentumFlywheel' // stacking damage + AS per second in combat
    | 'inductionCoil' // attacks grant adjacent allies mana
    | 'ablativeStack' // shred-immune; stacking armor when hit
    | 'emergencyBulkhead' // once at low HP: cleanse, shield, knockback
    | 'groundingRods' // stun/slow immune; blocks grant mana
    | 'foundryCore' // on death, reassemble into a sentry token
    | 'coolantReservoir' // uncapped bonus mana from damage; casts heal
    | 'prechargedCapacitors'; // start at full mana; later casts cost less

/**
 * An equippable item: either a base component (stat stick, dropped from
 * battles) or a combined item fused from two components on a unit.
 */
export interface ItemDef {
    id: string;
    name: string;
    /** Flavor + effect line shown in tooltips. */
    description: string;
    stats: ItemStats;
    /** Accent color for icons/chips. */
    color: string;
    /** The two component ids fused into this item (combined items only). */
    recipe?: [string, string];
    /** Sim effect hook (combined items only). */
    effect?: ItemEffectId;
}

/** Run-modifying reward chosen after elites / milestones. */
export interface AugmentDef {
    id: string;
    name: string;
    tier: 'silver' | 'gold' | 'prismatic';
    description: string;
    /**
     * Effect hook understood by the run/sim layers. Numeric effects are
     * expressed as modifier fields consumed where relevant.
     */
    effect: AugmentEffect;
}

/** Discriminated union of augment effects. */
export type AugmentEffect =
    | {
          type: 'teamStat';
          stat: 'hp' | 'atk' | 'armor' | 'atkSpeed';
          amount: number;
      }
    | { type: 'startingMana'; amount: number }
    | { type: 'traitDamage'; trait: TraitId; amount: number }
    | { type: 'interestCap'; amount: number }
    | { type: 'refreshDiscount'; amount: number }
    | { type: 'goldNow'; amount: number }
    | { type: 'bonusTeamSize'; amount: number }
    | { type: 'coreRepair'; amount: number };

/** One choice offered by a signal event. */
export interface EventChoice {
    label: string;
    /** Short consequence description shown under the label. */
    detail: string;
    /** Gold price to pick this choice; disabled when unaffordable. */
    costGold?: number;
    outcome: EventOutcome;
}

/** Discriminated union of event outcomes. */
export type EventOutcome =
    | { type: 'gold'; amount: number }
    | { type: 'coreDamage'; amount: number }
    | { type: 'coreRepair'; amount: number }
    | { type: 'freeUnit'; costTier: 1 | 2 | 3 | 4 | 5 }
    | { type: 'augment' }
    | { type: 'xp'; amount: number }
    | {
          type: 'gamble';
          win: EventOutcome;
          lose: EventOutcome;
          winChance: number;
      }
    | { type: 'nothing' };

/** A "signal event" node's content. */
export interface EventDef {
    id: string;
    title: string;
    body: string;
    choices: EventChoice[];
}

/** A single enemy placement inside a wave. */
export interface EnemyPlacement {
    unitId: string;
    star: 1 | 2 | 3;
    /** Board row 0-3 (enemy half), col 0-6. */
    row: number;
    col: number;
}

/** An authored enemy force for one battle node. */
export interface EnemyWaveDef {
    /** Display name ("Hostile Garrison"). */
    name: string;
    placements: EnemyPlacement[];
    /** Multiplier applied to enemy hp/atk on top of floor scaling. */
    statScale?: number;
}
