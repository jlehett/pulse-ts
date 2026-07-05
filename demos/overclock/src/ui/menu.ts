import { FONTS, HEX_CLIP, THEME, bevel } from '../config/theme';
import { randomSeedString, seedFromString } from '../run/rng';
import { div, hover, mountScreen } from './dom';
import { arrowIcon, playIcon, resumeIcon } from './icons';

/** What the player chose on the main menu. */
export interface MenuResult {
    action: 'new' | 'continue';
    /** Seed for new runs. */
    seed: string;
}

/** Info shown on the continue button. */
export interface ContinueInfo {
    floor: number;
    floors: number;
    core: number;
}

/** Deterministic daily seed (same for everyone on a given date). */
export function dailySeed(date = new Date()): string {
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let h = seedFromString(key);
    let tail = '';
    for (let i = 0; i < 5; i++) {
        tail += chars[h % chars.length];
        h = Math.floor(h / chars.length) ^ (h << 3);
        h = h >>> 0;
    }
    return `OVR-${tail}`;
}

/**
 * Shows the main menu and resolves with the player's choice.
 *
 * @param container - Element to mount into.
 * @param continueInfo - Saved-run info, or null when no save exists.
 */
export function showMainMenu(
    container: HTMLElement,
    continueInfo: ContinueInfo | null,
): Promise<MenuResult> {
    return new Promise((resolve) => {
        const { root, dispose } = mountScreen(
            container,
            `background:radial-gradient(120% 100% at 50% 32%, #143247 0%, #0b1a27 45%, ${THEME.bg} 78%);color:${THEME.text};`,
        );

        const finish = (result: MenuResult) => {
            dispose();
            resolve(result);
        };

        // Floating hex motes.
        const motes = [
            [16, 70, 10, THEME.accent, 6, 0],
            [31, 82, 7, THEME.accent, 7.5, 0.8],
            [68, 76, 9, THEME.accent, 8, 1.6],
            [82, 68, 6, THEME.gold, 9, 0.4],
            [52, 88, 8, THEME.accent, 7, 2.4],
        ] as const;
        for (const [x, y, size, color, dur, delay] of motes) {
            root.appendChild(
                div(
                    `position:absolute;left:${x}%;top:${y}%;width:${size}px;height:${size}px;background:${color};opacity:.35;` +
                        `clip-path:${HEX_CLIP};animation:ovcFloatUp ${dur}s ease-in ${delay}s infinite;`,
                ),
            );
        }
        // Vignette.
        root.appendChild(
            div(
                `position:absolute;inset:0;pointer-events:none;background:radial-gradient(120% 80% at 50% 40%, transparent 55%, rgba(0,0,0,.55) 100%);`,
            ),
        );

        const center = div(
            `position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:26px;`,
        );
        root.appendChild(center);

        // Hero: rotating emblem + tagline + title.
        const hero = div(
            `position:relative;display:flex;flex-direction:column;align-items:center;animation:ovcSlideUp .4s ease;`,
        );
        hero.appendChild(
            div(
                `position:absolute;top:50%;left:50%;transform:translate(-50%,-52%);width:440px;height:440px;pointer-events:none;`,
                `<div style="position:absolute;inset:0;animation:ovcCorePulse 3.4s ease-in-out infinite;background:radial-gradient(circle at 50% 50%, rgba(56,232,255,.22), transparent 62%)"></div>` +
                    `<svg viewBox="0 0 200 200" width="440" height="440" style="position:absolute;inset:0">` +
                    `<g style="transform-box:fill-box;transform-origin:center;animation:ovcSpin 46s linear infinite">` +
                    `<polygon points="100,14 174,57 174,143 100,186 26,143 26,57" fill="none" stroke="${THEME.accent}" stroke-width="0.8" opacity="0.45"/>` +
                    `<line x1="100" y1="6" x2="100" y2="16" stroke="${THEME.accent}" stroke-width="1" opacity="0.6"/>` +
                    `<line x1="100" y1="184" x2="100" y2="194" stroke="${THEME.accent}" stroke-width="1" opacity="0.6"/>` +
                    `</g>` +
                    `<g style="transform-box:fill-box;transform-origin:center;animation:ovcSpinRev 62s linear infinite">` +
                    `<polygon points="100,34 152,64 152,124 100,154 48,124 48,64" fill="none" stroke="${THEME.accent}" stroke-width="0.7" opacity="0.28"/>` +
                    `</g>` +
                    `<circle cx="100" cy="100" r="70" fill="none" stroke="${THEME.accent}" stroke-width="0.6" stroke-dasharray="2 7" opacity="0.35"/>` +
                    `<circle cx="100" cy="100" r="82" fill="none" stroke="${THEME.line}" stroke-width="0.8" opacity="0.6"/>` +
                    `</svg>`,
            ),
        );
        const chipDot = `<span style="width:6px;height:6px;background:${THEME.accent};clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%);box-shadow:0 0 6px ${THEME.accent}"></span>`;
        hero.appendChild(
            div(
                `position:relative;display:flex;align-items:center;gap:9px;padding:5px 15px;margin-bottom:16px;background:rgba(13,26,36,.6);` +
                    `border:1px solid ${THEME.line};backdrop-filter:blur(8px);clip-path:${bevel(9)};`,
                `${chipDot}<span style="font-size:12px;font-weight:600;letter-spacing:4px;color:#8fb8c8;text-transform:uppercase;white-space:nowrap">Rogue-Construct Auto-Battler</span>${chipDot}`,
            ),
        );
        hero.appendChild(
            div(
                `position:relative;font-family:${FONTS.display};font-weight:600;font-size:132px;line-height:.86;letter-spacing:11px;padding-left:11px;` +
                    `background:linear-gradient(180deg,#f2ffff 0%,#7fe9fb 42%,#25a9cc 100%);-webkit-background-clip:text;background-clip:text;color:transparent;` +
                    `animation:ovcTitleGlow 4s ease-in-out infinite;`,
                'OVERCLOCK',
            ),
        );
        hero.appendChild(
            div(
                `position:relative;margin-top:8px;font-size:15px;font-weight:500;letter-spacing:1px;color:#7f9db0;`,
                'Assemble the swarm. Overclock the core. Outlast the gauntlet.',
            ),
        );
        center.appendChild(hero);

        // Menu buttons.
        const menu = div(
            `position:relative;display:flex;flex-direction:column;gap:9px;width:432px;margin-top:6px;animation:ovcSlideUp .5s ease;`,
        );
        center.appendChild(menu);

        const newRun = div(
            `display:flex;align-items:center;gap:14px;padding:15px 20px;background:linear-gradient(92deg,${THEME.accent},#33c8f0);` +
                `color:${THEME.inkOnAccent};cursor:pointer;clip-path:${bevel(13)};box-shadow:0 6px 22px rgba(56,232,255,.28);transition:transform .15s, box-shadow .2s;`,
            `<span style="display:flex;align-items:center;justify-content:center;width:26px;height:26px;flex:none">${playIcon(22, THEME.inkOnAccent)}</span>` +
                `<span style="flex:1"><span style="display:block;font-family:${FONTS.display};font-size:24px;font-weight:600;letter-spacing:1px;line-height:1">NEW RUN</span>` +
                `<span style="display:block;font-size:12px;font-weight:600;opacity:.72;margin-top:1px">Begin a fresh gauntlet — randomized seed</span></span>` +
                `<span style="display:flex">${arrowIcon(20, THEME.inkOnAccent)}</span>`,
        );
        hover(newRun, {
            transform: 'translateY(-2px)',
            boxShadow: '0 10px 30px rgba(56,232,255,.45)',
        });
        newRun.addEventListener('click', () =>
            finish({ action: 'new', seed: randomSeedString() }),
        );
        menu.appendChild(newRun);

        if (continueInfo) {
            const cont = div(
                `display:flex;align-items:center;gap:14px;padding:12px 20px;background:rgba(13,26,36,.6);border:1px solid ${THEME.line};` +
                    `color:${THEME.text};backdrop-filter:blur(8px);cursor:pointer;clip-path:${bevel(11)};transition:transform .15s, border-color .15s, background .15s;`,
                `<span style="display:flex;align-items:center;justify-content:center;width:26px;height:26px;flex:none;color:${THEME.accent}">${resumeIcon(20, THEME.accent)}</span>` +
                    `<span style="flex:1"><span style="display:block;font-family:${FONTS.display};font-size:20px;font-weight:600;letter-spacing:.5px;line-height:1">CONTINUE RUN</span>` +
                    `<span style="display:block;font-size:11px;font-weight:600;color:${THEME.dim};margin-top:1px">Act I · Foundry Verge · Floor ${continueInfo.floor} / ${continueInfo.floors} · Core ${continueInfo.core}</span></span>` +
                    `<span style="font-size:12px;font-weight:700;letter-spacing:1px;color:${THEME.accent}">RESUME</span>`,
            );
            hover(cont, {
                borderColor: THEME.accent,
                background: 'rgba(23,44,60,.85)',
                transform: 'translateX(4px)',
            });
            cont.addEventListener('click', () =>
                finish({ action: 'continue', seed: '' }),
            );
            menu.appendChild(cont);
        }

        // Footer: version + daily seed (clickable — starts a seeded run).
        const daily = dailySeed();
        const footer = div(
            `position:absolute;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:space-between;padding:14px 24px;`,
        );
        footer.appendChild(
            div(
                `font-family:${FONTS.mono};font-size:11px;font-weight:500;color:${THEME.dimmer};`,
                'v0.1.0 · Overclock · a pulse-ts demo',
            ),
        );
        const dailyChip = div(
            `display:flex;align-items:center;gap:8px;padding:6px 12px;background:rgba(13,26,36,.6);border:1px solid ${THEME.line};` +
                `backdrop-filter:blur(8px);clip-path:${bevel(8)};cursor:pointer;`,
            `<span style="font-size:10px;font-weight:700;letter-spacing:1.5px;color:${THEME.dim};text-transform:uppercase">Daily Seed</span>` +
                `<span style="font-family:${FONTS.mono};font-size:12px;font-weight:500;color:${THEME.gold}">${daily}</span>`,
        );
        hover(dailyChip, { borderColor: THEME.gold });
        dailyChip.title = 'Start a run with the daily seed';
        dailyChip.addEventListener('click', () =>
            finish({ action: 'new', seed: daily }),
        );
        footer.appendChild(dailyChip);
        root.appendChild(footer);
    });
}
