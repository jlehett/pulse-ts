import type { Scaling } from '../config/types';
import { starScale } from '../config/units';

/**
 * The caster stats a {@link Scaling} expression reads. {@link CombatUnit}
 * satisfies this structurally; UI code can build one from a unit def, star
 * level and equipped items.
 */
export interface ScalingInputs {
    /** Star level (1-3); star-scales the flat `base` portion. */
    star: number;
    /** Current attack damage (already star-scaled). */
    atk: number;
    /** Current armor. */
    armor: number;
    /** Max HP (already star-scaled). */
    maxHp: number;
    /** Ability-power multiplier (1.0 = no bonus). */
    ap: number;
}

/**
 * Resolves a {@link Scaling} expression against a caster's stats:
 * `(starScale(base) + adRatio·ATK + armorRatio·Armor + hpRatio·maxHP)`,
 * multiplied by AP when `apScaled` is set.
 *
 * @param unit - Caster stats (a `CombatUnit` works directly).
 * @param scaling - The scaling expression to resolve.
 * @returns The resolved magnitude (unrounded).
 *
 * @example
 * resolveScaling(
 *     { star: 1, atk: 55, armor: 20, maxHp: 500, ap: 1 },
 *     { base: 60, adRatio: 1.45 },
 * ); // 139.75
 */
export function resolveScaling(unit: ScalingInputs, scaling: Scaling): number {
    let value = starScale(scaling.base ?? 0, unit.star);
    value += (scaling.adRatio ?? 0) * unit.atk;
    value += (scaling.armorRatio ?? 0) * unit.armor;
    value += (scaling.hpRatio ?? 0) * unit.maxHp;
    return scaling.apScaled ? value * unit.ap : value;
}
