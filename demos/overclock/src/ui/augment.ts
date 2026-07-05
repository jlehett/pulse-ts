import { FONTS, THEME, bevel } from '../config/theme';
import type { AugmentDef } from '../config/types';
import { applyAugment, augmentChoices, type RunState } from '../run/runState';
import { div, hover, mountScreen } from './dom';
import { augmentIcon } from './icons';

const TIER_COLORS: Record<AugmentDef['tier'], string> = {
    silver: '#b8c4cf',
    gold: '#ffcf5c',
    prismatic: '#b45cff',
};

/**
 * Shows a pick-1-of-3 augment screen, applies the chosen augment, and
 * resolves. Consumes one pending augment pick.
 *
 * @param container - Element to mount into.
 * @param run - Run state (mutated by the pick).
 */
export function showAugmentScreen(
    container: HTMLElement,
    run: RunState,
): Promise<void> {
    return new Promise((resolve) => {
        const choices = augmentChoices(run);
        if (choices.length === 0) {
            run.pendingAugments = Math.max(0, run.pendingAugments - 1);
            resolve();
            return;
        }

        const { root, dispose } = mountScreen(
            container,
            `display:flex;flex-direction:column;align-items:center;justify-content:center;gap:30px;` +
                `background:radial-gradient(120% 90% at 50% 0%, #142c3c 0%, ${THEME.bg} 62%);color:${THEME.text};`,
        );

        root.appendChild(
            div(
                `text-align:center;animation:ovcSlideUp .3s ease;`,
                `<div style="font-size:12px;font-weight:700;letter-spacing:3px;color:${THEME.dim};text-transform:uppercase;margin-bottom:4px">Firmware Uplink Established</div>` +
                    `<div style="font-family:${FONTS.display};font-size:44px;font-weight:600;letter-spacing:3px;color:#eaf6fb;line-height:1">CHOOSE AN AUGMENT</div>`,
            ),
        );

        const row = div(`display:flex;gap:18px;animation:ovcSlideUp .4s ease;`);
        root.appendChild(row);

        for (const aug of choices) {
            const color = TIER_COLORS[aug.tier];
            const card = div(
                `width:250px;padding:22px 20px 20px;background:rgba(13,26,36,.85);border:1px solid ${color};border-top:3px solid ${color};` +
                    `clip-path:${bevel(13)};cursor:pointer;transition:transform .15s, box-shadow .2s;backdrop-filter:blur(10px);`,
                `<div style="display:flex;align-items:center;justify-content:center;width:54px;height:54px;margin:0 auto 14px;background:${color}1e;` +
                    `border:1px solid ${color};clip-path:polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%)">${augmentIcon(30, color)}</div>` +
                    `<div style="text-align:center;font-size:9px;font-weight:700;letter-spacing:2.5px;color:${color};text-transform:uppercase;margin-bottom:5px">${aug.tier}</div>` +
                    `<div style="text-align:center;font-family:${FONTS.display};font-size:23px;font-weight:600;line-height:1.05;color:${THEME.text};margin-bottom:9px">${aug.name}</div>` +
                    `<div style="text-align:center;font-size:12.5px;line-height:1.45;color:#a9c2cf">${aug.description}</div>`,
            );
            hover(card, {
                transform: 'translateY(-4px)',
                boxShadow: `0 14px 40px ${color}33`,
            });
            card.addEventListener('click', () => {
                applyAugment(run, aug.id);
                dispose();
                resolve();
            });
            row.appendChild(card);
        }
    });
}
