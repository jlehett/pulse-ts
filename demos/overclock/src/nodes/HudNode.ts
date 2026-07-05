import { useContext, useDestroy, useFrameUpdate } from '@pulse-ts/core';
import { useSound } from '@pulse-ts/audio';
import { BattleCtx } from '../contexts';
import { FONTS, THEME, bevel } from '../config/theme';
import {
    BENCH_SIZE,
    COMBAT_TIME_LIMIT,
    XP_BUY_COST,
    sellValue,
} from '../config/economy';
import { TRAIT_BY_ID } from '../config/traits';
import type { UnitDef } from '../config/types';
import { UNIT_BY_ID, starScale } from '../config/units';
import {
    allOwned,
    boardCapacity,
    buyUnit,
    buyXp,
    defOf,
    refreshCost,
    rollShop,
    xpToNext,
} from '../run/runState';
import { countTraits } from '../sim/traits';
import { div, ensureKeyframes, hover } from '../ui/dom';
import {
    eliteIcon,
    heartIcon,
    lockIcon,
    manufacturerIcon,
    nodeIcon,
    refreshIcon,
    roleIcon,
    stars,
} from '../ui/icons';

/** Cost-tier card colors (border / top bar). */
const COST_COLORS: Record<number, [string, string]> = {
    1: ['#7d8790', '#8f9aa3'],
    2: ['#2b8f5a', '#2fbf6f'],
    3: ['#2f6fb0', '#2f8fff'],
    4: ['#9147c9', '#b45cff'],
    5: ['#c99a2a', '#ffb02e'],
};

/** Callbacks provided by the battle orchestrator. */
export interface HudProps {
    onStartCombat: () => void;
    onContinue: () => void;
}

/**
 * The in-battle HUD: run status, synergies, shop, economy actions, unit
 * tooltip and the end-of-combat result overlay. Raw-DOM driven with
 * revision-based dirty checks (SVG-heavy layout).
 */
export function HudNode(props: HudProps): void {
    const state = useContext(BattleCtx);
    ensureKeyframes();

    const buySfx = useSound('arpeggio', {
        notes: [523.25, 659.25],
        interval: 0.04,
        duration: 0.12,
        gain: 0.07,
        group: 'ui',
    });
    const refreshSfx = useSound('noise', {
        filter: 'highpass',
        frequency: 2400,
        duration: 0.08,
        gain: 0.05,
        group: 'ui',
    });
    const xpSfx = useSound('tone', {
        wave: 'triangle',
        frequency: [420, 660],
        duration: 0.1,
        gain: 0.07,
        group: 'ui',
    });
    const errorSfx = useSound('tone', {
        wave: 'square',
        frequency: [180, 140],
        duration: 0.09,
        gain: 0.05,
        group: 'ui',
    });

    const rootEl = div(
        `position:fixed;inset:0;pointer-events:none;z-index:100;font-family:${FONTS.body};color:${THEME.text};`,
    );
    document.body.appendChild(rootEl);
    useDestroy(() => rootEl.remove());

    const panelCss = (extra = '') =>
        `background:${THEME.panel};border:1px solid ${THEME.line};backdrop-filter:blur(9px);clip-path:${bevel(12)};${extra}`;

    // ── Top center: node + phase + timer ────────────────────────────────
    const nodeMetaColor =
        state.node.type === 'elite'
            ? THEME.enemy
            : state.node.type === 'boss'
              ? THEME.boss
              : THEME.accent;
    const topCenter = div(
        `position:absolute;top:14px;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:6px;`,
    );
    const stageChip = div(
        `display:flex;align-items:center;gap:14px;padding:7px 18px;${panelCss('box-shadow:0 10px 30px rgba(0,0,0,.45);')}`,
    );
    topCenter.appendChild(stageChip);
    const phaseLine = div(`display:flex;align-items:center;gap:7px;`);
    topCenter.appendChild(phaseLine);
    rootEl.appendChild(topCenter);

    // ── Top left: core + encounter ──────────────────────────────────────
    const topLeft = div(
        `position:absolute;top:14px;left:14px;width:212px;display:flex;flex-direction:column;gap:8px;`,
    );
    const corePanel = div(`padding:9px 11px;${panelCss()}`);
    topLeft.appendChild(corePanel);
    topLeft.appendChild(
        div(
            `display:flex;align-items:center;gap:10px;padding:8px 11px;${panelCss()}`,
            `<div style="width:36px;height:36px;border-radius:8px;border:1px solid ${nodeMetaColor};display:flex;align-items:center;justify-content:center;flex:none;box-shadow:inset 0 0 12px ${nodeMetaColor}33">${
                state.node.type === 'elite' || state.node.type === 'boss'
                    ? eliteIcon(21, nodeMetaColor)
                    : nodeIcon(state.node.type, 21, nodeMetaColor)
            }</div>` +
                `<div style="flex:1;min-width:0">` +
                `<div style="font-size:10px;font-weight:700;letter-spacing:2px;color:${THEME.dim};text-transform:uppercase">Act I · Floor ${state.node.floor + 1}</div>` +
                `<div style="font-size:15px;font-weight:700;color:${nodeMetaColor};line-height:1.15">${state.wave.name}</div></div>`,
        ),
    );
    rootEl.appendChild(topLeft);

    // ── Top right: synergies ────────────────────────────────────────────
    const synergies = div(
        `position:absolute;top:14px;right:14px;width:190px;display:flex;flex-direction:column;gap:5px;`,
    );
    rootEl.appendChild(synergies);

    // ── Bottom bar ──────────────────────────────────────────────────────
    const bottom = div(
        `position:absolute;left:0;right:0;bottom:0;padding:12px 14px 14px;display:flex;align-items:flex-end;justify-content:space-between;gap:14px;` +
            `background:linear-gradient(0deg, rgba(3,7,11,.82) 0%, rgba(3,7,11,.4) 60%, transparent 100%);`,
    );
    rootEl.appendChild(bottom);

    // Bottom left: level/xp/gold.
    const bottomLeft = div(
        `flex:none;width:200px;display:flex;flex-direction:column;gap:8px;pointer-events:auto;`,
    );
    const levelPanel = div(
        `display:flex;align-items:center;gap:10px;padding:8px 10px;${panelCss()}`,
    );
    bottomLeft.appendChild(levelPanel);
    const goldRow = div(`display:flex;gap:8px;`);
    const buyXpBtn = div(
        `flex:1;padding:8px 6px;text-align:center;${panelCss()}color:${THEME.text};font-weight:700;font-size:13px;letter-spacing:.5px;cursor:pointer;`,
        `Buy XP <span style="color:${THEME.gold}">${XP_BUY_COST}g</span>`,
    );
    hover(buyXpBtn, { borderColor: THEME.accent });
    buyXpBtn.addEventListener('click', () => {
        if (state.phase !== 'prep') return;
        if (buyXp(state.run)) {
            xpSfx.play();
            state.revision++;
        } else errorSfx.play();
    });
    const goldChip = div(
        `flex:none;display:flex;align-items:center;gap:6px;padding:8px 12px;${panelCss(`border-color:${THEME.gold};`)}`,
    );
    goldRow.appendChild(buyXpBtn);
    goldRow.appendChild(goldChip);
    bottomLeft.appendChild(goldRow);
    bottom.appendChild(bottomLeft);

    // Bottom center: shop.
    const shopWrap = div(
        `position:absolute;left:50%;bottom:14px;transform:translateX(-50%);display:flex;flex-direction:column;gap:8px;align-items:center;` +
            `width:760px;max-width:calc(100vw - 440px);pointer-events:auto;`,
    );
    const shopRow = div(
        `display:flex;gap:9px;width:100%;justify-content:center;`,
    );
    shopWrap.appendChild(shopRow);
    const shopControls = div(`display:flex;align-items:center;gap:9px;`);
    shopWrap.appendChild(shopControls);
    rootEl.appendChild(shopWrap);

    const lockBtn = div(
        `display:flex;align-items:center;gap:6px;padding:8px 13px;${panelCss()}color:${THEME.dim};font-weight:600;font-size:12px;letter-spacing:.5px;cursor:pointer;`,
    );
    lockBtn.addEventListener('click', () => {
        state.run.shopLocked = !state.run.shopLocked;
        state.revision++;
    });
    const refreshBtn = div(
        `display:flex;align-items:center;gap:7px;padding:8px 16px;background:${THEME.accent};color:${THEME.inkOnAccent};` +
            `font-weight:700;font-size:13px;cursor:pointer;clip-path:${bevel(8)};box-shadow:0 4px 16px ${THEME.accent}55;`,
    );
    hover(refreshBtn, { filter: 'brightness(1.12)' });
    refreshBtn.addEventListener('click', () => {
        if (state.phase !== 'prep') return;
        if (rollShop(state.run)) {
            refreshSfx.play();
            state.revision++;
        } else errorSfx.play();
    });
    shopControls.appendChild(lockBtn);
    shopControls.appendChild(refreshBtn);

    // Bottom right: team size + start combat.
    const bottomRight = div(
        `flex:none;width:212px;display:flex;flex-direction:column;gap:8px;align-items:stretch;pointer-events:auto;`,
    );
    const teamChip = div(`padding:8px 12px;text-align:center;${panelCss()}`);
    bottomRight.appendChild(teamChip);
    const startBtn = div(
        `padding:13px 10px;text-align:center;background:linear-gradient(92deg,${THEME.accent},#33c8f0);color:${THEME.inkOnAccent};` +
            `font-family:${FONTS.display};font-size:22px;font-weight:600;letter-spacing:1.5px;cursor:pointer;clip-path:${bevel(11)};` +
            `box-shadow:0 6px 22px ${THEME.accent}44;transition:transform .15s;`,
        'START COMBAT',
    );
    hover(startBtn, { transform: 'translateY(-2px)' });
    startBtn.addEventListener('click', () => {
        if (state.phase === 'prep') props.onStartCombat();
    });
    bottomRight.appendChild(startBtn);
    bottom.appendChild(bottomRight);

    // Tooltip (hovered unit).
    const tooltip = div(
        `position:absolute;right:14px;bottom:170px;width:270px;display:none;${panelCss(`clip-path:${bevel(13)};`)}padding:12px 14px;`,
    );
    rootEl.appendChild(tooltip);

    // Result overlay.
    const overlay = div(
        `position:absolute;inset:0;display:none;align-items:center;justify-content:center;background:rgba(3,7,11,.62);pointer-events:auto;`,
    );
    rootEl.appendChild(overlay);

    // ── Dirty-checked renders ───────────────────────────────────────────
    let lastShopKey = '';
    const renderShop = () => {
        const affordKey = state.run.shop
            .map((id) => {
                const def = id ? UNIT_BY_ID.get(id) : null;
                return def
                    ? `${id}:${state.run.gold >= def.cost ? 1 : 0}`
                    : '-';
            })
            .join('|');
        const key = `${affordKey}:${state.phase}:${state.run.shopLocked}`;
        if (key === lastShopKey) return;
        lastShopKey = key;

        shopRow.innerHTML = '';
        state.run.shop.forEach((defId, slot) => {
            const def = defId ? UNIT_BY_ID.get(defId) : null;
            if (!def) {
                shopRow.appendChild(
                    div(
                        `flex:1;max-width:142px;height:128px;border:1px dashed ${THEME.line};clip-path:${bevel(10)};opacity:.35;`,
                    ),
                );
                return;
            }
            const [border, top] = COST_COLORS[def.cost];
            const canBuy = state.phase === 'prep' && state.run.gold >= def.cost;
            const mColor = TRAIT_BY_ID.get(def.manufacturer)!.color;
            const rColor = TRAIT_BY_ID.get(def.role)!.color;
            const card = div(
                `flex:1;max-width:142px;background:rgba(13,26,36,.86);border:1px solid ${border};border-top:3px solid ${top};` +
                    `overflow:hidden;backdrop-filter:blur(9px);clip-path:${bevel(10)};cursor:${canBuy ? 'pointer' : 'default'};` +
                    `opacity:${canBuy ? 1 : 0.55};${def.cost >= 4 ? `box-shadow:0 0 18px ${top}44;` : ''}`,
                `<div style="height:64px;background:linear-gradient(160deg,${top}2e,#0a121b);position:relative;display:flex;align-items:center;justify-content:center">` +
                    `${roleIcon(def.role, 34, top)}` +
                    `<span style="position:absolute;top:5px;left:7px;display:flex;gap:4px">${manufacturerIcon(def.manufacturer, 13, mColor)}</span></div>` +
                    `<div style="padding:5px 7px 7px">` +
                    `<div style="display:flex;justify-content:space-between;align-items:center">` +
                    `<span style="font-size:12px;font-weight:700;color:${THEME.text}">${def.name}</span>` +
                    `<span style="display:flex;align-items:center;gap:3px"><span style="width:9px;height:9px;border-radius:50%;background:${THEME.gold}"></span>` +
                    `<span style="font-family:${FONTS.display};font-size:12px;font-weight:700;color:${THEME.gold}">${def.cost}</span></span></div>` +
                    `<div style="display:flex;gap:4px;margin-top:4px;flex-wrap:wrap">` +
                    `<span style="font-size:9.5px;font-weight:600;color:${mColor};background:#00000044;padding:1px 5px;border-radius:4px">${TRAIT_BY_ID.get(def.manufacturer)!.name}</span>` +
                    `<span style="font-size:9.5px;font-weight:600;color:${rColor};background:#00000044;padding:1px 5px;border-radius:4px">${TRAIT_BY_ID.get(def.role)!.name}</span>` +
                    `</div></div>`,
            );
            if (canBuy) {
                hover(card, { filter: 'brightness(1.2)' });
                card.addEventListener('click', () => {
                    if (buyUnit(state.run, slot)) {
                        buySfx.play();
                        state.revision++;
                    } else errorSfx.play();
                });
            }
            shopRow.appendChild(card);
        });

        lockBtn.innerHTML = `${lockIcon(14, state.run.shopLocked ? THEME.gold : THEME.dim)} ${
            state.run.shopLocked ? 'Locked' : 'Lock'
        }`;
        lockBtn.style.color = state.run.shopLocked ? THEME.gold : THEME.dim;
        refreshBtn.innerHTML =
            `${refreshIcon(15, THEME.inkOnAccent)} Refresh <span style="display:inline-flex;align-items:center;gap:3px;margin-left:1px">` +
            `<span style="width:11px;height:11px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff2c2,${THEME.gold});border:1px solid rgba(5,20,29,.35)"></span>` +
            `<span style="font-weight:800">${refreshCost(state.run)}</span></span>`;
        shopWrap.style.opacity = state.phase === 'prep' ? '1' : '0.25';
        shopWrap.style.pointerEvents = state.phase === 'prep' ? 'auto' : 'none';
    };

    let lastSynergyKey = '';
    const renderSynergies = () => {
        const defs = state.run.board.map((u) => defOf(u));
        const key =
            [...new Set(defs.map((d) => d.id))].sort().join(',') + state.phase;
        if (key === lastSynergyKey) return;
        lastSynergyKey = key;
        synergies.innerHTML = `<div style="font-size:11px;font-weight:700;letter-spacing:2px;color:${THEME.dim};text-transform:uppercase;padding-left:4px;margin-bottom:2px">Synergies</div>`;
        const rows = countTraits(defs);
        if (rows.length === 0) {
            synergies.appendChild(
                div(
                    `padding:8px 10px;${panelCss(`clip-path:${bevel(9)};`)}font-size:11.5px;color:${THEME.dim};`,
                    'Field constructs to activate synergies',
                ),
            );
            return;
        }
        for (const row of rows.slice(0, 8)) {
            const trait = TRAIT_BY_ID.get(row.id)!;
            const active = row.tier >= 0;
            const icon =
                trait.axis === 'manufacturer'
                    ? manufacturerIcon(
                          trait.id,
                          18,
                          active ? trait.color : THEME.dim,
                      )
                    : roleIcon(trait.id, 18, active ? trait.color : THEME.dim);
            const next = trait.tiers.find((t) => row.count < t.count);
            const progress = active
                ? trait.tiers[row.tier].effect
                : next
                  ? `${row.count} / ${next.count}`
                  : '';
            const rowEl = div(
                `display:flex;align-items:center;gap:8px;padding:6px 9px;background:${active ? THEME.panel : 'rgba(13,26,36,.55)'};` +
                    `border:1px solid ${active ? trait.color : THEME.line};${active ? '' : 'opacity:.55;'}` +
                    `backdrop-filter:blur(8px);clip-path:${bevel(9)};cursor:default;`,
                `<span style="display:flex;width:20px;height:20px;align-items:center;justify-content:center">${icon}</span>` +
                    `<span style="flex:1;min-width:0"><span style="display:block;font-size:12.5px;font-weight:700;color:${
                        active ? THEME.text : THEME.dim
                    };line-height:1.1">${trait.name}</span>` +
                    `<span style="display:block;font-size:9.5px;font-weight:600;color:${active ? trait.color : THEME.dim};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${progress}</span></span>` +
                    `<span style="font-family:${FONTS.display};font-size:14px;font-weight:600;color:${active ? trait.color : THEME.dim}">${row.count}</span>`,
            );
            rowEl.title = trait.description;
            synergies.appendChild(rowEl);
        }
    };

    let lastTooltipKey = '';
    const renderTooltip = () => {
        const uid = state.hoverUid;
        if (!uid) {
            if (lastTooltipKey !== '') {
                lastTooltipKey = '';
                tooltip.style.display = 'none';
            }
            return;
        }
        // Resolve the hovered unit from owned units, the enemy preview, or
        // the live sim.
        let def: UnitDef | null = null;
        let star = 1;
        let owned = false;
        const own = allOwned(state.run).find((u) => u.uid === uid);
        if (own) {
            def = defOf(own);
            star = own.star;
            owned = true;
        } else {
            const preview = state.wave.placements.find((p) => p.uid === uid);
            if (preview) {
                def = UNIT_BY_ID.get(preview.defId) ?? null;
                star = preview.star;
            } else if (state.combat) {
                const sim = state.combat.byUid.get(uid);
                if (sim) {
                    def = sim.def;
                    star = sim.star;
                }
            }
        }
        const key = def ? `${def.id}:${star}:${owned}` : '';
        if (key === lastTooltipKey) return;
        lastTooltipKey = key;
        if (!def) {
            tooltip.style.display = 'none';
            return;
        }
        const mTrait = TRAIT_BY_ID.get(def.manufacturer)!;
        const rTrait = TRAIT_BY_ID.get(def.role)!;
        const [, top] = COST_COLORS[def.cost];
        tooltip.style.display = 'block';
        tooltip.innerHTML =
            `<div style="display:flex;justify-content:space-between;align-items:baseline">` +
            `<span style="font-family:${FONTS.display};font-size:21px;font-weight:600;color:${top}">${def.name}</span>` +
            `<span style="font-size:12px;color:${THEME.gold}">${stars(star)}</span></div>` +
            `<div style="font-size:10.5px;font-weight:600;color:${THEME.dim};margin-bottom:6px">${def.epithet}</div>` +
            `<div style="display:flex;gap:5px;margin-bottom:8px">` +
            `<span style="display:flex;align-items:center;gap:4px;font-size:10.5px;font-weight:600;color:${mTrait.color};background:#00000044;padding:2px 7px;border-radius:4px">${manufacturerIcon(def.manufacturer, 11, mTrait.color)}${mTrait.name}</span>` +
            `<span style="display:flex;align-items:center;gap:4px;font-size:10.5px;font-weight:600;color:${rTrait.color};background:#00000044;padding:2px 7px;border-radius:4px">${roleIcon(def.role, 11, rTrait.color)}${rTrait.name}</span></div>` +
            `<div style="display:flex;gap:10px;font-size:11px;color:${THEME.text};margin-bottom:8px">` +
            `<span>HP <b style="color:${THEME.ally}">${starScale(def.stats.hp, star)}</b></span>` +
            `<span>ATK <b style="color:${THEME.enemy}">${starScale(def.stats.atk, star)}</b></span>` +
            `<span>ARM <b>${def.stats.armor}</b></span>` +
            `<span>RNG <b>${def.stats.range}</b></span></div>` +
            `<div style="border-top:1px solid ${THEME.line};padding-top:7px">` +
            `<div style="font-size:12px;font-weight:700;color:${THEME.arcane}">${def.ability.name}</div>` +
            `<div style="font-size:11px;line-height:1.4;color:#a9c2cf">${def.ability.description}</div></div>` +
            (owned && state.phase === 'prep'
                ? `<div style="margin-top:7px;font-size:10px;color:${THEME.dim}">Right-click to sell for ${sellValue(def.cost, star)}g · drag to reposition</div>`
                : '');
    };

    let overlayShown = false;
    const renderOverlay = () => {
        const ended = state.phase === 'victory' || state.phase === 'defeat';
        if (!ended) {
            if (overlayShown) {
                overlayShown = false;
                overlay.style.display = 'none';
            }
            return;
        }
        if (overlayShown) return;
        overlayShown = true;
        const won = state.phase === 'victory';
        const accent = won ? THEME.accent : THEME.enemy;
        const res = state.resolution;
        overlay.style.display = 'flex';
        overlay.innerHTML = '';
        const panel = div(
            `display:flex;flex-direction:column;align-items:center;gap:14px;padding:34px 54px;background:rgba(9,18,26,.92);` +
                `border:1px solid ${accent};clip-path:${bevel(18)};box-shadow:0 20px 70px rgba(0,0,0,.6);animation:ovcSlideUp .3s ease;`,
            `<div style="font-size:11px;font-weight:700;letter-spacing:3px;color:${THEME.dim};text-transform:uppercase">${state.wave.name}</div>` +
                `<div style="font-family:${FONTS.display};font-size:64px;font-weight:600;letter-spacing:5px;line-height:.9;color:${accent};` +
                `filter:drop-shadow(0 0 22px ${accent}66)">${won ? 'VICTORY' : 'DEFEAT'}</div>` +
                (res
                    ? won
                        ? `<div style="display:flex;gap:14px;font-size:14px;font-weight:600;color:${THEME.text}">` +
                          `<span style="color:${THEME.gold}">+${res.goldEarned} gold</span><span>+2 XP</span>` +
                          (res.augmentOffered
                              ? `<span style="color:${THEME.arcane}">Augment unlocked</span>`
                              : '') +
                          `</div>`
                        : `<div style="display:flex;gap:14px;font-size:14px;font-weight:600;color:${THEME.text}">` +
                          `<span style="color:${THEME.enemy}">${heartIcon(13, THEME.enemy)} -${res.coreDamage} core integrity</span></div>`
                    : ''),
        );
        const btn = div(
            `padding:12px 36px;background:${accent};color:${THEME.inkOnAccent};font-weight:700;font-size:15px;letter-spacing:1px;` +
                `cursor:pointer;clip-path:${bevel(10)};`,
            won
                ? 'CONTINUE'
                : state.run.status === 'defeat'
                  ? 'ACCEPT FATE'
                  : 'REGROUP',
        );
        hover(btn, { filter: 'brightness(1.15)' });
        btn.addEventListener('click', () => props.onContinue());
        panel.appendChild(btn);
        overlay.appendChild(panel);
    };

    // ── Per-frame cheap updates ─────────────────────────────────────────
    useFrameUpdate(() => {
        const run = state.run;
        // Stage chip.
        const inCombat = state.phase === 'combat';
        const timer = inCombat
            ? Math.max(0, state.timeLeft)
            : COMBAT_TIME_LIMIT;
        const mm = Math.floor(timer / 60);
        const ss = String(Math.floor(timer % 60)).padStart(2, '0');
        stageChip.innerHTML =
            `<span style="font-family:${FONTS.display};font-weight:600;font-size:20px;letter-spacing:2px;line-height:1">1-${state.node.floor + 1}</span>` +
            `<span style="width:1px;height:20px;background:${THEME.line}"></span>` +
            `<span style="display:flex;align-items:center;gap:7px">` +
            `<span style="width:9px;height:9px;border-radius:50%;background:${inCombat ? THEME.enemy : THEME.accent};box-shadow:0 0 10px ${
                inCombat ? THEME.enemy : THEME.accent
            };${inCombat ? 'animation:ovcPulseSoft 1.1s infinite;' : ''}"></span>` +
            `<span style="font-family:${FONTS.display};font-weight:600;font-size:18px;color:${inCombat ? THEME.enemy : THEME.accent}">${mm}:${ss}</span></span>`;
        phaseLine.innerHTML = `<span style="font-size:12px;font-weight:600;letter-spacing:2px;color:${THEME.dim};text-transform:uppercase">${
            state.phase === 'prep'
                ? 'Preparation'
                : state.phase === 'combat'
                  ? 'Combat Phase'
                  : 'Resolution'
        }</span>`;

        // Core panel.
        corePanel.innerHTML =
            `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:7px">` +
            `<span style="display:flex;align-items:center;gap:6px;color:${THEME.ally}">${heartIcon(15, THEME.ally)}` +
            `<span style="font-size:11px;font-weight:700;letter-spacing:1.5px;color:${THEME.dim};text-transform:uppercase">Core Integrity</span></span>` +
            `<span style="font-family:${FONTS.display};font-size:14px;font-weight:700;color:${THEME.ally}">${run.core}<span style="font-size:10px;color:${THEME.dim}">/100</span></span></div>` +
            `<div style="height:8px;border-radius:5px;background:#00000066;overflow:hidden;box-shadow:inset 0 1px 3px #000">` +
            `<div style="height:100%;width:${run.core}%;background:linear-gradient(90deg,${THEME.ally},${THEME.accent});border-radius:5px;box-shadow:0 0 8px ${THEME.accent}"></div></div>`;

        // Level / xp / gold.
        const need = xpToNext(run);
        levelPanel.innerHTML =
            `<div style="flex:1;min-width:0">` +
            `<div style="display:flex;align-items:baseline;gap:6px">` +
            `<span style="font-family:${FONTS.display};font-weight:700;font-size:15px;color:${THEME.accent}">Lv ${run.level}</span>` +
            `<span style="font-size:11px;color:${THEME.dim}">${need === null ? 'MAX' : `${run.xp} / ${need} xp`}</span></div>` +
            `<div style="height:5px;border-radius:3px;background:#00000066;margin-top:4px;overflow:hidden">` +
            `<div style="height:100%;width:${need === null ? 100 : (100 * run.xp) / need}%;background:linear-gradient(90deg,${THEME.accent},${THEME.ally});border-radius:3px"></div></div></div>`;
        goldChip.innerHTML =
            `<span style="width:14px;height:14px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff2c2,${THEME.gold});box-shadow:0 0 8px ${THEME.gold}"></span>` +
            `<span style="font-family:${FONTS.display};font-weight:700;font-size:16px;color:${THEME.gold}">${run.gold}</span>`;

        // Team size + start button.
        teamChip.innerHTML =
            `<span style="font-size:10px;font-weight:700;letter-spacing:2px;color:${THEME.dim};text-transform:uppercase">Deployed</span> ` +
            `<span style="font-family:${FONTS.display};font-size:17px;font-weight:600;color:${
                run.board.length > boardCapacity(run) ? THEME.enemy : THEME.text
            }">${run.board.length} / ${boardCapacity(run)}</span>` +
            `<span style="margin-left:8px;font-size:10px;color:${THEME.dim}">Bench ${run.bench.length}/${BENCH_SIZE}</span>`;
        startBtn.style.display = state.phase === 'prep' ? 'block' : 'none';
        startBtn.style.opacity = run.board.length > 0 ? '1' : '0.45';
        buyXpBtn.style.opacity = state.phase === 'prep' ? '1' : '0.4';

        renderShop();
        renderSynergies();
        renderTooltip();
        renderOverlay();
    });
}
