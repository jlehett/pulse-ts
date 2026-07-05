import { FONTS, THEME, bevel } from '../config/theme';
import type { RunState } from '../run/runState';
import { div, hover, mountScreen } from './dom';

/**
 * Shows the end-of-run summary (victory or defeat) and resolves when the
 * player returns to the menu.
 *
 * @param container - Element to mount into.
 * @param run - The finished run.
 */
export function showSummaryScreen(
    container: HTMLElement,
    run: RunState,
): Promise<void> {
    return new Promise((resolve) => {
        const victory = run.status === 'victory';
        const accent = victory ? THEME.accent : THEME.enemy;
        const { root, dispose } = mountScreen(
            container,
            `display:flex;flex-direction:column;align-items:center;justify-content:center;gap:26px;` +
                `background:radial-gradient(120% 90% at 50% 30%, ${victory ? '#123247' : '#2c1218'} 0%, ${THEME.bg} 70%);color:${THEME.text};`,
        );

        root.appendChild(
            div(
                `text-align:center;animation:ovcSlideUp .35s ease;`,
                `<div style="font-size:13px;font-weight:700;letter-spacing:4px;color:${THEME.dim};text-transform:uppercase;margin-bottom:6px">` +
                    `${victory ? 'Act I Cleared' : 'Core Integrity Lost'}</div>` +
                    `<div style="font-family:${FONTS.display};font-weight:600;font-size:96px;letter-spacing:8px;line-height:.9;` +
                    `background:linear-gradient(180deg,#f2ffff 0%,${victory ? '#7fe9fb' : '#ff9aa5'} 45%,${accent} 100%);` +
                    `-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 0 26px ${accent}55)">` +
                    `${victory ? 'VICTORY' : 'SHUTDOWN'}</div>`,
            ),
        );

        const stat = (label: string, value: string) =>
            `<div style="display:flex;flex-direction:column;align-items:center;padding:12px 22px;background:${THEME.panel};` +
            `border:1px solid ${THEME.line};clip-path:${bevel(10)}">` +
            `<span style="font-size:10px;font-weight:700;letter-spacing:2px;color:${THEME.dim};text-transform:uppercase">${label}</span>` +
            `<span style="font-family:${FONTS.display};font-size:26px;font-weight:600;color:${THEME.text};line-height:1.1">${value}</span></div>`;

        root.appendChild(
            div(
                `display:flex;gap:12px;animation:ovcSlideUp .45s ease;`,
                stat('Battles Won', String(run.battlesWon)) +
                    stat('Nodes Cleared', String(run.completedNodes.length)) +
                    stat('Level', String(run.level)) +
                    stat('Augments', String(run.augments.length)) +
                    stat('Core', String(run.core)),
            ),
        );

        root.appendChild(
            div(
                `font-family:${FONTS.mono};font-size:12px;color:${THEME.dimmer};`,
                `Seed ${run.seed}`,
            ),
        );

        const back = div(
            `display:flex;align-items:center;gap:10px;padding:13px 34px;background:linear-gradient(92deg,${accent},${
                victory ? '#33c8f0' : '#e04756'
            });color:${THEME.inkOnAccent};font-weight:700;font-size:16px;letter-spacing:1px;cursor:pointer;` +
                `clip-path:${bevel(11)};box-shadow:0 6px 22px ${accent}44;transition:transform .15s;animation:ovcSlideUp .5s ease;`,
            'RETURN TO MENU',
        );
        hover(back, { transform: 'translateY(-2px)' });
        back.addEventListener('click', () => {
            dispose();
            resolve();
        });
        root.appendChild(back);
    });
}
