import type { ItemDef, UnitDef } from '../config/types';
import type { ItemRuntime } from './items';

/** Which side of the board a combat unit fights for. */
export type Team = 'player' | 'enemy';

/** A unit placement handed to the sim at combat start. */
export interface PlacedUnit {
    /** Stable instance id (unique within the battle). */
    uid: string;
    defId: string;
    star: number;
    row: number;
    col: number;
    /** Equipped item ids (components or combined items, max 3). */
    items?: string[];
}

/** Per-unit combat modifiers derived from traits and augments. */
export interface UnitMods {
    /** Multiplier on all damage dealt. */
    damageMult: number;
    /** Flat barrier granted at combat start (Aegisline). */
    startShieldFlat: number;
    /** Bonus damage fraction while the unit's shield holds (Aegisline). */
    shieldedDamageBonus: number;
    /** Permanent attack-speed fraction (Redline). */
    atkSpeedFlat: number;
    /** Mana stolen from the target per attack (Blacksite). */
    manaSiphon: number;
    /** Fraction of attack damage splashed to hexes adjacent to the target. */
    splashPct: number;
    /** Fraction of max HP restored when re-forming after death (Hardlight). */
    reformPct: number;
    /** Attack-speed fraction stacked per second while stationary (Turret). */
    stationaryAtkSpeedPerSec: number;
    /** Whether the unit deploys into the enemy backline (Flanker). */
    backlineSpawn: boolean;
    /** Stacking damage fraction gained per kill (Flanker). */
    damagePerKill: number;
    /** Share of adjacent allies' damage this unit absorbs (Bulwark). */
    interceptPct: number;
    /** Flat damage reduction fraction on damage taken (Bulwark). */
    damageReduction: number;
    /** Bonus fraction on healing this unit casts (Medic). */
    healBoost: number;
    /** Whether overhealing from this unit's casts becomes shield (Medic). */
    overhealShield: boolean;
    /** Bonus damage fraction on every 3rd attack, which also splashes. */
    bombardierBonus: number;
    /** Discord fraction applied to targets on attack (Amplifier / Iris). */
    discordOnHit: number;
    /** Whether applied Discord lasts the whole combat (Iris). */
    discordPermanent: boolean;
    /** Whether the unit can never move (Emplacement). */
    immobile: boolean;
    /** Flat range bonus (Emplacement). */
    rangeBonus: number;
    /** Fraction of attack damage dealt returned as healing (Vulture). */
    lifestealPct: number;
    /** Stacking damage fraction gained per ramp interval (Surgecore). */
    rampDamage: number;
    /** Fraction of max HP regenerated per second (Juggernaut). */
    regenPctPerSec: number;
    /** Armor shredded from the target per attack (Breaker). */
    armorShredPerHit: number;
    /** Bonus damage fraction vs enemies below half HP (Reaper). */
    executeDamageBonus: number;
    /** Stacking attack-speed fraction gained per kill (Bladeform). */
    atkSpeedPerKill: number;
}

/** Live state of one unit inside the combat sim. */
export interface CombatUnit {
    uid: string;
    def: UnitDef;
    team: Team;
    star: number;
    row: number;
    col: number;
    alive: boolean;

    hp: number;
    maxHp: number;
    shield: number;
    mana: number;
    manaMax: number;
    atk: number;
    /** Ability-power multiplier applied to AP-scaled magnitudes (base 1). */
    ap: number;
    /** Base attacks per second before speed modifiers. */
    atkSpeed: number;
    armor: number;
    range: number;

    mods: UnitMods;
    /** Equipped item definitions. */
    items: ItemDef[];
    /** Mutable item passive state (stacks, once-per-combat flags). */
    itemFx: ItemRuntime;

    /** Seconds until next auto-attack is allowed. */
    attackCooldown: number;
    /** Seconds until next move step is allowed. */
    moveCooldown: number;
    /** Current target uid, if any. */
    targetUid: string | null;

    /** Auto-attacks performed (drives Bombardier's every-3rd shell). */
    attackCount: number;
    /** Whether the unit has left its starting hex (breaks Turret stacks). */
    hasMoved: boolean;
    /** Turret stacking attack-speed bonus (fraction). */
    turretStacks: number;
    /** Flanker stacking damage bonus (fraction). */
    killStacks: number;
    /** Surgecore accumulated damage bonus (fraction). */
    rampBonus: number;
    /** Seconds until the next Surgecore ramp stack. */
    rampTickIn: number;
    /** Bladeform stacking attack-speed bonus (fraction). */
    atkSpeedKillStacks: number;

    /** Auto-attacks remaining with Overcharge bonus damage. */
    empoweredAttacks: number;
    /** Flat bonus damage per empowered auto-attack. */
    empowerFlat: number;
    /** Whether empowered attacks pierce one hex behind the target. */
    empowerPierce: boolean;
    /** Gauntlet cleave: seconds remaining and flat bonus while active. */
    cleaveRemaining: number;
    cleaveFlat: number;

    /** Seconds the unit is stunned (cannot act or move). */
    stunRemaining: number;
    /** Attack-speed slow debuff: fraction and seconds remaining. */
    slowAmount: number;
    slowRemaining: number;
    /** Mark debuff: attackers heal this flat amount; seconds remaining. */
    markHeal: number;
    markRemaining: number;

    /** Burn DoT: damage per second, seconds remaining, next-tick timer. */
    burnRate: number;
    burnRemaining: number;
    burnTickIn: number;
    /** Unit credited with burn damage (kill stacks, events). */
    burnSource: CombatUnit | null;

    /** Discord debuff: bonus damage taken and time remaining. */
    discordAmount: number;
    /** Remaining Discord seconds (Infinity = permanent). */
    discordRemaining: number;
    /** Temporary damage buff (empower/valkyrie): fraction and seconds. */
    damageBuff: number;
    damageBuffRemaining: number;
    /** Temporary attack-speed buff (aura): fraction and seconds. */
    atkSpeedBuff: number;
    atkSpeedBuffRemaining: number;
    /** HP regenerated per second and seconds remaining (transcend). */
    regenRate: number;
    regenRemaining: number;
    /** Seconds the unit cannot drop below 1 HP (transcend). */
    undyingRemaining: number;
    /** Seconds the unit cannot cast (EMP). */
    silenceRemaining: number;

    /** Whether the unit already re-formed this combat (Hardlight/Valkyr). */
    reformUsed: boolean;
    /** Multiplier on this unit's ability power (Adaptive Core copy). */
    abilityMult: number;
    /** Active sweep channel, if any. */
    channel: SweepChannel | null;
}

/** State of an in-progress sweep channel (Lockdown Protocol etc.). */
export interface SweepChannel {
    /** Seconds of channel remaining. */
    remaining: number;
    /** Seconds between column ticks. */
    interval: number;
    /** Seconds until the next tick. */
    tickIn: number;
    /** Column the next tick hits. */
    col: number;
    /** Sweep direction: +1 (left to right) or -1. */
    dir: 1 | -1;
    /** Damage per tick. */
    power: number;
}

/** A scheduled unit revival (Hardlight re-form, Guardian Protocol). */
export interface PendingRevive {
    uid: string;
    /** Combat time at which the unit re-forms. */
    at: number;
    /** Fraction of max HP restored. */
    hpPct: number;
}

/** Events emitted by the sim for rendering/audio playback. */
export type CombatEvent =
    | { type: 'attack'; from: string; to: string; ranged: boolean }
    | {
          type: 'hit';
          target: string;
          amount: number;
          crit: boolean;
          source: string;
      }
    | { type: 'cast'; unit: string; ability: string; kind: string }
    | { type: 'shield'; unit: string; amount: number }
    | { type: 'heal'; unit: string; amount: number }
    | { type: 'death'; unit: string }
    | { type: 'revive'; unit: string }
    | { type: 'summon'; unit: string }
    | { type: 'sweep'; unit: string; col: number }
    | { type: 'move'; unit: string; row: number; col: number };

/** Result phase of a combat. */
export type CombatPhase = 'running' | 'playerWin' | 'enemyWin';

/** The full sim state for one battle round. */
export interface CombatState {
    units: CombatUnit[];
    byUid: Map<string, CombatUnit>;
    /** Elapsed combat seconds. */
    time: number;
    phase: CombatPhase;
    /** Events accumulated since last drain (renderer consumes these). */
    events: CombatEvent[];
    /** Scheduled revivals (units are dead until their timer fires). */
    pendingRevives: PendingRevive[];
    /** Whether each team has spent its Guardian Protocol revive. */
    guardianUsed: { player: boolean; enemy: boolean };
    /** Sequence for uids of units spawned mid-combat (summons). */
    spawnSeq: number;
    /** Deterministic RNG in [0, 1). */
    rng: () => number;
}
