/**
 * Pure data types for Overclock's game content. No engine imports — these
 * describe the roster, traits, augments, events and enemy waves that the
 * run layer and combat sim consume.
 */

/** The two trait axes every construct belongs to. */
export type TraitAxis = 'manufacturer' | 'role';

/** Identifier unions keep content references typo-safe. */
export type ManufacturerId =
    | 'hexawatt'
    | 'ferrocrete'
    | 'whisperline'
    | 'scrapline'
    | 'cryostat';

export type RoleId =
    | 'vanguard'
    | 'breacher'
    | 'gunner'
    | 'longshot'
    | 'swarm'
    | 'catalyst';

export type TraitId = ManufacturerId | RoleId;

/** A single activation breakpoint of a trait. */
export interface TraitTier {
    /** Unique units of this trait required to activate the tier. */
    count: number;
    /** Human description of the effect at this tier. */
    effect: string;
}

/** A trait definition (one entry on either axis). */
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

/** Ability behavior archetypes implemented by the combat sim. */
export type AbilityKind =
    | 'strike' // heavy hit on current target
    | 'nova' // AoE around self
    | 'chain' // arcs between several enemies
    | 'pierce' // damages every enemy in a line through the target
    | 'shield' // shields self (and optionally adjacent allies)
    | 'chill' // damage + heavy attack-speed slow
    | 'surge'; // damage + grants mana to allies

/** Parametrized ability attached to a unit. */
export interface AbilityDef {
    name: string;
    description: string;
    kind: AbilityKind;
    /**
     * Primary magnitude. Damage kinds: flat magic damage (scaled by star).
     * 'shield': shield amount. 'rally': attack-speed bonus (fraction).
     * 'surge': damage dealt; mana granted is `aux`.
     */
    power: number;
    /**
     * Secondary parameter, meaning depends on kind: blast/nova radius in
     * hexes, chain jump count, chill slow fraction, shield spread flag (1 =
     * adjacent allies too), rally duration seconds, surge mana amount.
     */
    aux?: number;
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

/** A construct (purchasable unit) definition. */
export interface UnitDef {
    id: string;
    name: string;
    /** Shop cost in gold; also the unit's tier (1-5). */
    cost: 1 | 2 | 3 | 4 | 5;
    manufacturer: ManufacturerId;
    role: RoleId;
    /** Short flavor descriptor shown on cards ("Recon Skimmer"). */
    epithet: string;
    stats: UnitStats;
    ability: AbilityDef;
    /** True for enemy-only constructs that never appear in the shop. */
    enemyOnly?: boolean;
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
