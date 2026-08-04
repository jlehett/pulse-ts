/**
 * Item icon SVGs and rich tooltip markup for the equipment system.
 * Components render as a solid hex with a per-component glyph; combined
 * items render as a two-color hex blending their recipe components.
 */

import { COMPONENTS, ITEM_BY_ID, combineItems } from '../config/items';
import type { ItemDef } from '../config/types';
import { FONTS, THEME } from '../config/theme';

/** Colors for stat/scaling tags shared by item and ability tooltips. */
export const STAT_COLORS = {
    atk: '#ff8a50',
    ap: '#b98cff',
    atkSpeed: '#ffd24a',
    armor: '#8fb7c9',
    hp: '#6ee787',
    mana: '#4ac9ff',
} as const;

const HEX_POINTS = '12,2.2 20.5,7.1 20.5,16.9 12,21.8 3.5,16.9 3.5,7.1';

/** Per-component glyph drawn inside the hex. */
function componentGlyph(id: string, color: string): string {
    switch (id) {
        case 'cell':
            return `<path d="M13.2 5.5l-5.4 7.8h3.6L9.6 19l5.8-8.2h-3.6z" fill="${color}"/>`;
        case 'core':
            return `<rect x="8.4" y="8.4" width="7.2" height="7.2" rx="1" fill="none" stroke="${color}" stroke-width="1.5"/><circle cx="12" cy="12" r="1.4" fill="${color}"/>`;
        case 'coil':
            return `<path d="M6.5 12h2.2l1.6-3.6 3 7.2 1.6-3.6h2.6" fill="none" stroke="${color}" stroke-width="1.6" stroke-linejoin="round"/>`;
        case 'plate':
            return `<path d="M12 5.6l4.8 2v3.6c0 3-2 5-4.8 6-2.8-1-4.8-3-4.8-6V7.6z" fill="none" stroke="${color}" stroke-width="1.5"/>`;
        case 'frame':
            return `<path d="M8.4 6.4v11.2M15.6 6.4v11.2M8.4 12h7.2" fill="none" stroke="${color}" stroke-width="1.6"/>`;
        case 'flux':
            return `<path d="M12 5.6c2.3 3 3.8 4.9 3.8 6.8a3.8 3.8 0 0 1-7.6 0c0-1.9 1.5-3.8 3.8-6.8z" fill="none" stroke="${color}" stroke-width="1.5"/>`;
        default:
            return `<circle cx="12" cy="12" r="2.4" fill="${color}"/>`;
    }
}

/**
 * SVG icon for an item. Components get their glyph; combined items get a
 * two-color hex derived from their recipe.
 *
 * @param item - Item definition.
 * @param size - Icon size in px.
 * @returns SVG markup string.
 *
 * @example
 * el.innerHTML = itemIcon(ITEM_BY_ID.get('cell')!, 28);
 */
export function itemIcon(item: ItemDef, size: number): string {
    if (!item.recipe) {
        return (
            `<svg width="${size}" height="${size}" viewBox="0 0 24 24">` +
            `<polygon points="${HEX_POINTS}" fill="${item.color}1f" stroke="${item.color}" stroke-width="1.6"/>` +
            componentGlyph(item.id, item.color) +
            `</svg>`
        );
    }
    const [a, b] = item.recipe.map((id) => ITEM_BY_ID.get(id)!.color);
    const gradId = `ovcItem-${item.id}`;
    return (
        `<svg width="${size}" height="${size}" viewBox="0 0 24 24">` +
        `<defs><linearGradient id="${gradId}" x1="0" y1="0" x2="1" y2="1">` +
        `<stop offset="0%" stop-color="${a}"/><stop offset="100%" stop-color="${b}"/></linearGradient></defs>` +
        `<polygon points="${HEX_POINTS}" fill="url(#${gradId})" opacity="0.32"/>` +
        `<polygon points="${HEX_POINTS}" fill="none" stroke="url(#${gradId})" stroke-width="1.8"/>` +
        `<polygon points="12,7.2 16.2,9.6 16.2,14.4 12,16.8 7.8,14.4 7.8,9.6" fill="${item.color}" opacity="0.9"/>` +
        `</svg>`
    );
}

/** One colored stat chip ("+15 ATK"). */
function statChip(text: string, color: string): string {
    return `<span style="font-size:12px;font-weight:700;color:${color};background:#00000044;padding:1px 7px;border-radius:4px">${text}</span>`;
}

/**
 * Colored stat chips for an item's flat bonuses.
 *
 * @param item - Item definition.
 * @returns Concatenated chip markup ("+15 ATK · +15% AP").
 */
export function itemStatChips(item: ItemDef): string {
    const s = item.stats;
    const chips: string[] = [];
    if (s.atk) chips.push(statChip(`+${s.atk} ATK`, STAT_COLORS.atk));
    if (s.ap)
        chips.push(statChip(`+${Math.round(s.ap * 100)}% AP`, STAT_COLORS.ap));
    if (s.atkSpeed) {
        chips.push(
            statChip(
                `+${Math.round(s.atkSpeed * 100)}% AS`,
                STAT_COLORS.atkSpeed,
            ),
        );
    }
    if (s.armor) chips.push(statChip(`+${s.armor} ARM`, STAT_COLORS.armor));
    if (s.hp) chips.push(statChip(`+${s.hp} HP`, STAT_COLORS.hp));
    if (s.mana) chips.push(statChip(`+${s.mana} MANA`, STAT_COLORS.mana));
    return chips.join('');
}

/**
 * Full tooltip body for an item: name, stat chips, passive description,
 * plus recipe (combined) or every combination it can build (component).
 *
 * @param item - Item definition.
 * @returns Tooltip inner HTML.
 */
export function itemTooltipHtml(item: ItemDef): string {
    let html =
        `<div style="display:flex;align-items:center;gap:9px;margin-bottom:7px">` +
        `<span style="display:flex;flex:none">${itemIcon(item, 36)}</span>` +
        `<span style="font-family:${FONTS.display};font-size:20px;font-weight:600;color:${item.color};line-height:1.05">${item.name}</span></div>` +
        `<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px">${itemStatChips(item)}</div>` +
        `<div style="font-size:13px;line-height:1.4;color:${THEME.text};opacity:.88">${item.description}</div>`;

    if (item.recipe) {
        const parts = item.recipe.map((id) => ITEM_BY_ID.get(id)!);
        html +=
            `<div style="display:flex;align-items:center;gap:7px;margin-top:10px;padding-top:9px;border-top:1px solid ${THEME.line}">` +
            `<span style="font-size:11px;font-weight:700;letter-spacing:1.5px;color:${THEME.dim};text-transform:uppercase">Recipe</span>` +
            parts
                .map(
                    (p) =>
                        `<span style="display:flex;align-items:center;gap:4px">${itemIcon(p, 20)}<span style="font-size:12px;color:${p.color}">${p.name}</span></span>`,
                )
                .join(
                    `<span style="color:${THEME.dim};font-size:12px">+</span>`,
                ) +
            `</div>`;
    } else {
        const combos = COMPONENTS.map((other) => ({
            other,
            combined: combineItems(item.id, other.id)!,
        }));
        html +=
            `<div style="margin-top:10px;padding-top:9px;border-top:1px solid ${THEME.line}">` +
            `<div style="font-size:11px;font-weight:700;letter-spacing:1.5px;color:${THEME.dim};text-transform:uppercase;margin-bottom:6px">Combines Into</div>` +
            `<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 9px">` +
            combos
                .map(
                    ({ other, combined }) =>
                        `<span style="display:flex;align-items:center;gap:4px;min-width:0" title="${other.name}: ${combined.description.replace(/"/g, '&quot;')}">` +
                        `${itemIcon(other, 16)}<span style="color:${THEME.dim};font-size:11px">→</span>${itemIcon(combined, 18)}` +
                        `<span style="font-size:11.5px;color:${THEME.text};opacity:.85;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${combined.name}</span></span>`,
                )
                .join('') +
            `</div></div>`;
    }
    return html;
}
