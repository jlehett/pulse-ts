import { FONTS, THEME, bevel } from '../config/theme';
import type { EventDef } from '../config/types';
import { applyEventOutcome, type RunState } from '../run/runState';
import { div, hover, mountScreen } from './dom';
import { eventIcon } from './icons';

/**
 * Shows a signal-event screen, applies the chosen outcome to the run, and
 * resolves once the player acknowledges the result.
 *
 * @param container - Element to mount into.
 * @param run - Run state (mutated by the chosen outcome).
 * @param event - Event content to present.
 */
export function showEventScreen(
    container: HTMLElement,
    run: RunState,
    event: EventDef,
): Promise<void> {
    return new Promise((resolve) => {
        const { root, dispose } = mountScreen(
            container,
            `display:flex;align-items:center;justify-content:center;` +
                `background:radial-gradient(120% 90% at 50% 0%, #1c1230 0%, ${THEME.bg} 60%);color:${THEME.text};`,
        );

        const card = div(
            `width:560px;background:rgba(20,14,34,.85);border:1px solid ${THEME.arcane};backdrop-filter:blur(12px);` +
                `clip-path:${bevel(16)};padding:26px 30px;box-shadow:0 18px 60px rgba(0,0,0,.6);animation:ovcSlideUp .3s ease;`,
        );
        root.appendChild(card);

        const render = () => {
            card.innerHTML =
                `<div style="display:flex;align-items:center;gap:12px;margin-bottom:6px">` +
                `<span style="display:flex;width:40px;height:40px;align-items:center;justify-content:center;border:1px solid ${THEME.arcane};clip-path:${bevel(9)};background:#b45cff22">${eventIcon(24, '#c98bff')}</span>` +
                `<div><div style="font-size:10px;font-weight:700;letter-spacing:2.5px;color:#9a83c0;text-transform:uppercase">Signal Event</div>` +
                `<div style="font-family:${FONTS.display};font-size:30px;font-weight:600;letter-spacing:1px;line-height:1;color:#f0e9ff">${event.title}</div></div></div>` +
                `<div style="font-size:14.5px;line-height:1.55;color:#d8ccee;opacity:.92;margin:12px 0 20px">${event.body}</div>`;

            const choices = div(`display:flex;flex-direction:column;gap:9px;`);
            card.appendChild(choices);

            for (const choice of event.choices) {
                const affordable =
                    !choice.costGold || run.gold >= choice.costGold;
                const btn = div(
                    `display:flex;align-items:center;gap:12px;padding:12px 16px;border:1px solid ${
                        affordable ? '#3a2456' : '#241832'
                    };` +
                        `background:rgba(30,20,50,.5);clip-path:${bevel(10)};cursor:${affordable ? 'pointer' : 'not-allowed'};` +
                        `opacity:${affordable ? 1 : 0.45};transition:border-color .15s, background .15s;`,
                    `<span style="flex:1"><span style="display:block;font-weight:700;font-size:15px;color:#f0e9ff">${choice.label}</span>` +
                        `<span style="display:block;font-size:12px;font-weight:500;color:#9a83c0;margin-top:1px">${choice.detail}</span></span>` +
                        (choice.costGold
                            ? `<span style="display:flex;align-items:center;gap:5px;font-family:${FONTS.display};font-size:15px;color:${THEME.gold}">` +
                              `<span style="width:11px;height:11px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff2c2,${THEME.gold})"></span>${choice.costGold}</span>`
                            : ''),
                );
                if (affordable) {
                    hover(btn, {
                        borderColor: THEME.arcane,
                        background: 'rgba(48,30,80,.6)',
                    });
                    btn.addEventListener('click', () => {
                        if (choice.costGold) run.gold -= choice.costGold;
                        const result = applyEventOutcome(run, choice.outcome);
                        renderResult(choice.label, result.summary);
                    });
                }
                choices.appendChild(btn);
            }
        };

        const renderResult = (label: string, summary: string) => {
            card.innerHTML =
                `<div style="font-size:10px;font-weight:700;letter-spacing:2.5px;color:#9a83c0;text-transform:uppercase;margin-bottom:6px">${event.title}</div>` +
                `<div style="font-family:${FONTS.display};font-size:24px;font-weight:600;color:#f0e9ff;margin-bottom:4px">${label}</div>` +
                `<div style="font-size:17px;font-weight:600;color:${THEME.accent};margin-bottom:22px">${summary}</div>`;
            const cont = div(
                `display:inline-flex;align-items:center;gap:8px;padding:11px 26px;background:${THEME.arcane};color:#140a22;` +
                    `font-weight:700;font-size:14px;letter-spacing:.5px;cursor:pointer;clip-path:${bevel(9)};`,
                'Continue',
            );
            hover(cont, { filter: 'brightness(1.15)' });
            cont.addEventListener('click', () => {
                dispose();
                resolve();
            });
            card.appendChild(cont);
        };

        render();
    });
}
