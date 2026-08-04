import { ITEM_BY_ID } from '../config/items';
import type { ItemDef, ItemEffectId } from '../config/types';

/** Hybrid Actuator: empowered attacks per cast and flat bonus (× AP). */
export const HYBRID_ATTACKS = 3;
export const HYBRID_BONUS = 30;
/** Overheat Driver: AS per stack, stack cap, vent burn dps (× AP), self hit. */
export const OVERHEAT_AS_PER_STACK = 0.04;
export const OVERHEAT_STACK_CAP = 20;
export const OVERHEAT_BURN_RATE = 50;
export const OVERHEAT_SELF_HP_FRAC = 0.08;
/** Kinetic Ram: attack cadence and slow applied on the shove. */
export const KINETIC_EVERY = 4;
export const KINETIC_SLOW = 0.3;
export const KINETIC_SLOW_DURATION = 2;
/** Salvage Claws: permanent ATK and heal fraction per kill. */
export const SALVAGE_ATK = 10;
export const SALVAGE_HEAL_FRAC = 0.2;
/** Voltage Spike: mana burned per attack and bonus damage per point. */
export const VOLTAGE_MANA_BURN = 8;
export const VOLTAGE_DMG_PER_MANA = 2;
/** Echo Processor: delay before the repeat and its power fraction. */
export const ECHO_DELAY = 1;
export const ECHO_POWER = 0.4;
/** Predictive Targeting: AS granted per cast and duration. */
export const PREDICTIVE_AS = 0.25;
export const PREDICTIVE_DURATION = 4;
/** Firewall Matrix: shield (× AP) and the Discord applied to attackers. */
export const FIREWALL_SHIELD = 120;
export const FIREWALL_DISCORD = 0.15;
export const FIREWALL_DISCORD_DURATION = 4;
/** Repair Subroutine: heal per cast (× AP). */
export const REPAIR_HEAL = 120;
/** Overclock Kernel: permanent AP gained per cast. */
export const KERNEL_AP_PER_CAST = 0.1;
/** Gatling Conversion: multiplier on attack damage. */
export const GATLING_DAMAGE_MULT = 0.75;
/** Bunker Servos: armor and AS gained per stationary second. */
export const BUNKER_ARMOR_PER_SEC = 2;
export const BUNKER_AS_PER_SEC = 0.02;
/** Momentum Flywheel: damage + AS fraction gained per second in combat. */
export const FLYWHEEL_PER_SEC = 0.02;
/** Induction Coil: mana granted to adjacent allies per attack. */
export const INDUCTION_MANA = 2;
/** Ablative Stack: armor per hit taken and total cap. */
export const ABLATIVE_ARMOR_PER_HIT = 2;
export const ABLATIVE_ARMOR_CAP = 40;
/** Emergency Bulkhead: trigger threshold and shield fraction. */
export const BULKHEAD_HP_THRESHOLD = 0.5;
export const BULKHEAD_SHIELD_FRAC = 0.25;
/** Grounding Rods: mana granted per blocked stun/slow. */
export const GROUNDING_MANA = 10;
/** Foundry Core: sentry HP as a fraction of the holder's max HP. */
export const FOUNDRY_HP_FRAC = 0.5;
/** Coolant Reservoir: mana-from-damage multiplier and heal per cast. */
export const COOLANT_MANA_MULT = 1.5;
export const COOLANT_HEAL_FRAC = 0.08;
/** Precharged Capacitors: mana-cost discount after the first cast. */
export const PRECHARGED_DISCOUNT = 0.2;

/** Mutable per-unit item state tracked by the combat sim. */
export interface ItemRuntime {
    /** Overheat Driver: current attack-speed stacks. */
    overheatStacks: number;
    /** Hybrid Actuator: empowered attacks remaining. */
    hybridAttacks: number;
    /** Echo Processor: whether the once-per-combat echo has been armed. */
    echoUsed: boolean;
    /** Echo Processor: combat time the echo fires (0 = none pending). */
    echoAt: number;
    /** Emergency Bulkhead: whether the once-per-combat trigger fired. */
    bulkheadUsed: boolean;
    /** Ablative Stack: armor gained so far (capped). */
    ablativeGained: number;
    /** Momentum Flywheel: damage/AS fraction accrued over combat time. */
    flywheelSpin: number;
    /** Bunker Servos: attack-speed fraction accumulated while dug in. */
    bunkerAtkSpeed: number;
    /** Precharged Capacitors: whether the first cast has resolved. */
    firstCastDone: boolean;
}

/**
 * Fresh item runtime state for a combat unit.
 *
 * @returns All counters zeroed / flags cleared.
 *
 * @example
 * const fx = createItemRuntime();
 * fx.overheatStacks; // 0
 */
export function createItemRuntime(): ItemRuntime {
    return {
        overheatStacks: 0,
        hybridAttacks: 0,
        echoUsed: false,
        echoAt: 0,
        bulkheadUsed: false,
        ablativeGained: 0,
        flywheelSpin: 0,
        bunkerAtkSpeed: 0,
        firstCastDone: false,
    };
}

/**
 * Resolves item ids to their definitions, throwing on unknown ids.
 *
 * @param ids - Item ids equipped on a unit.
 * @returns The matching {@link ItemDef}s.
 *
 * @example
 * itemsFor(['cell', 'core']).map((i) => i.name);
 * // ['Power Cell', 'Logic Core']
 */
export function itemsFor(ids: readonly string[]): ItemDef[] {
    return ids.map((id) => {
        const item = ITEM_BY_ID.get(id);
        if (!item) throw new Error(`Unknown item: ${id}`);
        return item;
    });
}

/** Summed stat bonuses of a set of equipped items. */
export interface AggregatedItemStats {
    atk: number;
    ap: number;
    atkSpeed: number;
    armor: number;
    hp: number;
    mana: number;
}

/**
 * Sums the stat bonuses of a set of equipped items.
 *
 * @param items - Equipped item definitions.
 * @returns Totals with every field defined (0 when absent).
 *
 * @example
 * aggregateItemStats(itemsFor(['cell', 'cell'])).atk; // 30
 */
export function aggregateItemStats(
    items: readonly ItemDef[],
): AggregatedItemStats {
    const out: AggregatedItemStats = {
        atk: 0,
        ap: 0,
        atkSpeed: 0,
        armor: 0,
        hp: 0,
        mana: 0,
    };
    for (const item of items) {
        out.atk += item.stats.atk ?? 0;
        out.ap += item.stats.ap ?? 0;
        out.atkSpeed += item.stats.atkSpeed ?? 0;
        out.armor += item.stats.armor ?? 0;
        out.hp += item.stats.hp ?? 0;
        out.mana += item.stats.mana ?? 0;
    }
    return out;
}

/**
 * Whether any equipped item carries the given passive effect.
 *
 * @param items - Equipped item definitions.
 * @param effect - The effect hook to look for.
 * @returns True when the effect is present.
 *
 * @example
 * hasItemEffect(itemsFor(['railgunChassis']), 'railgun'); // true
 */
export function hasItemEffect(
    items: readonly ItemDef[],
    effect: ItemEffectId,
): boolean {
    return items.some((item) => item.effect === effect);
}
