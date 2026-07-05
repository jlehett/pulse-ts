import type { UnitDef } from '../config/types';

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
}

/** Per-unit combat modifiers derived from traits and augments. */
export interface UnitMods {
    critChance: number;
    dodgeChance: number;
    /** Mana generated per second passively. */
    manaRegen: number;
    /** Armor gained per second of combat. */
    armorPerSec: number;
    /** Flat attack damage gained per second of combat. */
    atkPerSec: number;
    /** Attack-speed fraction gained per auto-attack (stacking, capped). */
    atkSpeedPerAttack: number;
    /** Attack-speed slow applied to targets on hit (0 = none). */
    chillOnHit: number;
    /** Bonus damage fraction per hex of distance to target. */
    damagePerHex: number;
    /** Fraction of max HP granted as a shield at combat start. */
    startShieldPct: number;
    /** Chance a kill by this unit grants +1 gold. */
    killGoldChance: number;
    /** Multiplier on ability damage/shielding. */
    abilityPower: number;
    /** Multiplier on all damage dealt. */
    damageMult: number;
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
    /** Base attacks per second before speed modifiers. */
    atkSpeed: number;
    armor: number;
    range: number;

    mods: UnitMods;

    /** Seconds until next auto-attack is allowed. */
    attackCooldown: number;
    /** Seconds until next move step is allowed. */
    moveCooldown: number;
    /** Current target uid, if any. */
    targetUid: string | null;
    /** Gunner-style stacking attack-speed bonus (fraction). */
    atkSpeedStacks: number;
    /** Chill debuff: attack-speed slow fraction and time remaining. */
    chillAmount: number;
    chillRemaining: number;
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
    | { type: 'dodge'; target: string }
    | { type: 'cast'; unit: string; ability: string; kind: string }
    | { type: 'shield'; unit: string; amount: number }
    | { type: 'death'; unit: string }
    | { type: 'move'; unit: string; row: number; col: number }
    | { type: 'goldDrop'; unit: string };

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
    /** Bonus gold earned during combat (Scrapline drops). */
    bonusGold: number;
    /** Deterministic RNG in [0, 1). */
    rng: () => number;
}
