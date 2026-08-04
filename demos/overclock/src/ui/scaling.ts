/**
 * Ability scaling breakdown markup: computed magnitudes with colored tags
 * showing exactly which stats (base / AD / ARM / HP, × AP) feed each value.
 */

import { FONTS, THEME } from '../config/theme';
import type { Scaling } from '../config/types';
import { starScale } from '../config/units';
import { resolveScaling, type ScalingInputs } from '../sim/scaling';
import { STAT_COLORS } from './items';

/**
 * Whether a scaling expression is a damage/heal-style magnitude worth a
 * breakdown row. Tiny bases with no ratios are counts, multipliers or
 * fractions (jump counts, mimic power) — the prose already covers those.
 */
export function isMagnitude(scaling: Scaling): boolean {
    if (scaling.adRatio || scaling.armorRatio || scaling.hpRatio) return true;
    return (scaling.base ?? 0) >= 20;
}

function tag(text: string, color: string): string {
    return `<span style="font-size:11px;font-weight:700;color:${color};background:#00000044;padding:1px 6px;border-radius:4px;white-space:nowrap">${text}</span>`;
}

function pct(ratio: number): string {
    const v = ratio * 100;
    return `${Number.isInteger(v) ? v : v.toFixed(1)}%`;
}

/**
 * One breakdown row: computed value plus formula tags.
 *
 * @param label - Row label ("Primary", "Secondary").
 * @param scaling - The scaling expression.
 * @param inputs - Caster stats (star, ATK, armor, max HP, AP).
 * @returns Row markup, or '' when the expression isn't a magnitude.
 *
 * @example
 * scalingRowHtml('Primary', { base: 60, adRatio: 1.45 }, inputs);
 */
export function scalingRowHtml(
    label: string,
    scaling: Scaling,
    inputs: ScalingInputs,
): string {
    if (!isMagnitude(scaling)) return '';
    const value = Math.round(resolveScaling(inputs, scaling));
    const tags: string[] = [];
    const base = starScale(scaling.base ?? 0, inputs.star);
    if (base > 0) tags.push(tag(`${base}`, THEME.dim));
    if (scaling.adRatio) {
        tags.push(tag(`+${pct(scaling.adRatio)} AD`, STAT_COLORS.atk));
    }
    if (scaling.armorRatio) {
        tags.push(tag(`+${pct(scaling.armorRatio)} ARM`, STAT_COLORS.armor));
    }
    if (scaling.hpRatio) {
        tags.push(tag(`+${pct(scaling.hpRatio)} HP`, STAT_COLORS.hp));
    }
    if (scaling.apScaled) tags.push(tag('× AP', STAT_COLORS.ap));
    return (
        `<div style="display:flex;align-items:center;gap:5px;flex-wrap:wrap;margin-top:6px">` +
        `<span style="font-size:10.5px;font-weight:700;letter-spacing:1px;color:${THEME.dim};text-transform:uppercase;width:64px;flex:none">${label}</span>` +
        `<span style="font-family:${FONTS.display};font-size:17px;font-weight:700;color:${THEME.accent};line-height:1">${value}</span>` +
        `<span style="font-size:11px;color:${THEME.dim}">=</span>` +
        tags.join('') +
        `</div>`
    );
}
