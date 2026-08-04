import { useContext, useDestroy, useFrameUpdate } from '@pulse-ts/core';
import { useSound } from '@pulse-ts/audio';
import { useThreeContext } from '@pulse-ts/three';
import { BattleCtx } from '../contexts';
import { FONTS, THEME, UI_SCALE, bevel } from '../config/theme';
import {
    BENCH_SIZE,
    COMBAT_TIME_LIMIT,
    XP_BUY_COST,
    sellValue,
} from '../config/economy';
import { ARCHETYPE_BY_ID } from '../config/archetypes';
import { COMPONENTS, ITEM_BY_ID, combineItems } from '../config/items';
import { TRAIT_BY_ID } from '../config/traits';
import type { ItemDef, UnitDef } from '../config/types';
import { SHOP_UNITS, UNITS, UNIT_BY_ID, starScale } from '../config/units';
import {
    allOwned,
    boardCapacity,
    buyUnit,
    buyXp,
    chooseSalvage,
    debugGrantUnit,
    defOf,
    equipItem,
    equippedItems,
    previewReward,
    refreshCost,
    rollShop,
    xpToNext,
} from '../run/runState';
import { aggregateItemStats } from '../sim/items';
import type { ScalingInputs } from '../sim/scaling';
import { countTraits, type TraitCount } from '../sim/traits';
import { div, ensureKeyframes, hover } from '../ui/dom';
import {
    STAT_COLORS,
    itemIcon,
    itemStatChips,
    itemTooltipHtml,
} from '../ui/items';
import { scalingRowHtml } from '../ui/scaling';
import { unitPortrait } from '../ui/portraits';
import {
    eliteIcon,
    heartIcon,
    lockIcon,
    nodeIcon,
    primeIcon,
    refreshIcon,
    stars,
    traitIcon,
} from '../ui/icons';

/** The trait definitions a unit carries, in manufacturer/role/prime order. */
function defTraits(def: UnitDef) {
    return [def.manufacturer, def.role, def.prime]
        .filter((id): id is NonNullable<typeof id> => id !== undefined)
        .map((id) => TRAIT_BY_ID.get(id)!);
}

/** Outlined archetype tag chip ("Tank", "Caster") for cards and tooltips. */
function archetypeChip(def: UnitDef, fontSize: number): string {
    const arch = ARCHETYPE_BY_ID.get(def.archetype)!;
    return (
        `<span title="${arch.description}" style="font-size:${fontSize}px;font-weight:600;color:#c6d4de;` +
        `border:1px solid #ffffff30;background:#ffffff10;padding:1px 6px;border-radius:4px">${arch.name}</span>`
    );
}

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
    const equipSfx = useSound('arpeggio', {
        notes: [659.25, 880],
        interval: 0.035,
        duration: 0.1,
        gain: 0.07,
        group: 'ui',
    });

    const { renderer } = useThreeContext();

    const rootEl = div(
        `position:fixed;inset:0;pointer-events:none;z-index:100;zoom:${UI_SCALE};font-family:${FONTS.body};color:${THEME.text};`,
    );
    document.body.appendChild(rootEl);
    useDestroy(() => rootEl.remove());

    // Vignette behind all panels.
    rootEl.appendChild(
        div(
            `position:absolute;inset:0;pointer-events:none;background:radial-gradient(130% 80% at 50% 42%, transparent 55%, rgba(0,0,0,.55) 100%);`,
        ),
    );

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

    // Static per-battle suffix on the phase line: `· {wave name}` with icon.
    const waveSuffix =
        `<span style="font-size:12px;color:${THEME.dim}">·</span>` +
        `<span style="display:flex;align-items:center;gap:4px;font-size:12px;font-weight:700;letter-spacing:1px;color:${nodeMetaColor}">${
            state.node.type === 'elite' || state.node.type === 'boss'
                ? eliteIcon(13, nodeMetaColor)
                : nodeIcon(state.node.type, 13, nodeMetaColor)
        }${state.wave.name}</span>`;

    // Round pip tracker: one pip per floor of the act.
    const pipRow = div(`display:flex;gap:4px;margin-top:2px;`);
    for (let f = 0; f < state.run.map.floors; f++) {
        const boss = f === state.run.map.floors - 1;
        const current = f === state.node.floor;
        const color = boss
            ? THEME.gold
            : current
              ? THEME.enemy
              : f < state.node.floor
                ? THEME.accent
                : THEME.line;
        pipRow.appendChild(
            div(
                `width:${boss ? 22 : 16}px;height:5px;border-radius:3px;background:${color};` +
                    (current || boss ? `box-shadow:0 0 8px ${color};` : ''),
            ),
        );
    }
    topCenter.appendChild(pipRow);
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
    const rewardPanel = div(`padding:8px 11px;${panelCss()}`);
    topLeft.appendChild(rewardPanel);
    rootEl.appendChild(topLeft);

    let lastRewardKey = '';
    const renderReward = () => {
        const reward = previewReward(state.run);
        const key = `${reward.gold}:${reward.augment}:${reward.items}`;
        if (key === lastRewardKey) return;
        lastRewardKey = key;
        rewardPanel.innerHTML =
            `<div style="font-size:10px;font-weight:700;letter-spacing:2px;color:${THEME.dim};text-transform:uppercase;margin-bottom:7px">Victory Reward</div>` +
            `<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">` +
            `<div style="display:flex;align-items:center;gap:5px;padding:4px 8px;background:#00000033;border-radius:7px;border:1px solid ${THEME.gold}55">` +
            `<div style="width:12px;height:12px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff2c2,${THEME.gold});box-shadow:0 0 6px ${THEME.gold}"></div>` +
            `<span style="font-family:${FONTS.display};font-size:13px;font-weight:700;color:${THEME.gold}">+${reward.gold}</span></div>` +
            (reward.items > 0
                ? `<div style="display:flex;align-items:center;gap:5px;padding:4px 8px;background:#00000033;border-radius:7px;border:1px solid ${THEME.accent}55;color:${THEME.accent}">` +
                  `<svg width="13" height="13" viewBox="0 0 24 24"><polygon points="12,2.2 20.5,7.1 20.5,16.9 12,21.8 3.5,16.9 3.5,7.1" fill="none" stroke="${THEME.accent}" stroke-width="2"/></svg>` +
                  `<span style="font-size:12px;font-weight:700">+${reward.items} Item${reward.items > 1 ? 's' : ''}</span></div>`
                : '') +
            (reward.augment
                ? `<div style="display:flex;align-items:center;gap:5px;padding:4px 8px;background:#00000033;border-radius:7px;border:1px solid ${THEME.arcane}55;color:#c98bff">` +
                  `${primeIcon(14, '#c98bff')}<span style="font-size:12px;font-weight:700">Augment</span></div>`
                : '') +
            `</div>`;
    };

    let lastItemsKey = '';
    const renderItems = () => {
        const key = `${state.run.items.join(',')}:${state.phase}`;
        if (key === lastItemsKey) return;
        lastItemsKey = key;
        itemTray.innerHTML = `<div style="font-size:11px;font-weight:700;letter-spacing:2px;color:${THEME.dim};text-transform:uppercase;margin-bottom:6px">Items</div>`;
        const row = div(`display:flex;gap:6px;flex-wrap:wrap;min-height:32px;`);
        itemTray.appendChild(row);
        if (state.run.items.length === 0) {
            row.appendChild(
                div(
                    `font-size:12px;color:${THEME.dim};align-self:center;`,
                    'Win battles to salvage components',
                ),
            );
            return;
        }
        for (const id of state.run.items) {
            const item = ITEM_BY_ID.get(id);
            if (!item) continue;
            const cell = div(
                `width:34px;height:34px;display:flex;align-items:center;justify-content:center;` +
                    `cursor:${state.phase === 'prep' ? 'grab' : 'default'};touch-action:none;`,
                itemIcon(item, 32),
            );
            cell.addEventListener('mouseenter', () => {
                if (state.dragItem) return;
                itemTip.innerHTML = itemTooltipHtml(item);
                itemTip.style.display = 'block';
            });
            cell.addEventListener('mouseleave', () => {
                itemTip.style.display = 'none';
            });
            cell.addEventListener('pointerdown', (e) => startItemDrag(item, e));
            hover(cell, { transform: 'scale(1.18)' });
            row.appendChild(cell);
        }
    };

    // ── Top right: synergies ────────────────────────────────────────────
    const synergies = div(
        `position:absolute;top:14px;right:14px;width:176px;display:flex;flex-direction:column;gap:5px;pointer-events:auto;`,
    );
    rootEl.appendChild(synergies);

    // Rich synergy tooltip, shown to the left of the synergy list.
    const synergyTip = div(
        `position:absolute;top:14px;right:200px;width:310px;display:none;` +
            `background:rgba(13,26,36,.96);border:1px solid ${THEME.line};backdrop-filter:blur(12px);` +
            `box-shadow:0 16px 40px rgba(0,0,0,.55);clip-path:${bevel(14)};padding:13px 14px;`,
    );
    rootEl.appendChild(synergyTip);

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
    const itemTray = div(`padding:8px 10px;${panelCss()}`);
    bottomLeft.appendChild(itemTray);
    const combosBtn = div(
        `padding:6px 10px;text-align:center;${panelCss()}color:${THEME.dim};font-weight:700;font-size:11px;letter-spacing:1.5px;cursor:pointer;text-transform:uppercase;`,
        'Item Combinations',
    );
    hover(combosBtn, { borderColor: THEME.accent, color: THEME.text });
    bottomLeft.appendChild(combosBtn);
    const debugBtn = div(
        `padding:6px 10px;text-align:center;${panelCss()}color:${THEME.dim};font-weight:700;font-size:11px;letter-spacing:1.5px;cursor:pointer;text-transform:uppercase;`,
        'Debug: Free Units',
    );
    hover(debugBtn, { borderColor: THEME.gold, color: THEME.text });
    bottomLeft.appendChild(debugBtn);
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
            `width:760px;max-width:calc(100vw / ${UI_SCALE} - 440px);pointer-events:auto;`,
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

    // Hovered-unit info panel.
    const tooltip = div(
        `position:absolute;right:14px;bottom:170px;width:300px;display:none;` +
            `background:rgba(13,26,36,.94);border:1px solid ${THEME.accent};backdrop-filter:blur(12px);` +
            `box-shadow:0 16px 40px rgba(0,0,0,.55);clip-path:${bevel(14)};padding:14px 15px;`,
    );
    rootEl.appendChild(tooltip);

    // Hovered-item info panel (above the item tray).
    const itemTip = div(
        `position:absolute;left:14px;bottom:200px;width:300px;display:none;` +
            `background:rgba(13,26,36,.94);border:1px solid ${THEME.line};backdrop-filter:blur(12px);` +
            `box-shadow:0 16px 40px rgba(0,0,0,.55);clip-path:${bevel(14)};padding:12px 13px;`,
    );
    rootEl.appendChild(itemTip);

    // ── Item combinations chart ─────────────────────────────────────────
    // Built lazily on first open. Hovering any icon (component or combined)
    // fills a dedicated side tip — never the hovered element itself.
    let combosOverlay: HTMLDivElement | null = null;
    let combosTip: HTMLDivElement | null = null;
    const combosTipIdle = `<div style="font-size:13px;color:${THEME.dim}">Hover any icon for full details</div>`;

    const buildCombosOverlay = () => {
        combosOverlay = div(
            `position:absolute;inset:0;display:none;align-items:center;justify-content:center;` +
                `background:rgba(3,7,11,.72);pointer-events:auto;z-index:300;`,
        );
        combosOverlay.addEventListener('mousedown', (e) => {
            if (e.target === combosOverlay)
                combosOverlay!.style.display = 'none';
        });
        const wrap = div(
            `display:flex;gap:12px;align-items:stretch;animation:ovcSlideUp .25s ease;`,
        );
        const panel = div(
            `padding:16px 18px 18px;background:rgba(9,18,26,.96);border:1px solid ${THEME.accent};` +
                `clip-path:${bevel(14)};box-shadow:0 20px 70px rgba(0,0,0,.6);`,
        );
        const header = div(
            `display:flex;align-items:center;gap:10px;margin-bottom:12px;`,
        );
        header.appendChild(
            div(
                `font-family:${FONTS.display};font-size:22px;font-weight:600;letter-spacing:2px;color:${THEME.accent};line-height:1;`,
                'ITEM COMBINATIONS',
            ),
        );
        const closeBtn = div(
            `margin-left:auto;width:24px;height:24px;display:flex;align-items:center;justify-content:center;` +
                `border:1px solid ${THEME.line};border-radius:6px;color:${THEME.dim};font-size:12px;font-weight:700;cursor:pointer;`,
            '✕',
        );
        hover(closeBtn, { borderColor: THEME.enemy, color: THEME.enemy });
        closeBtn.addEventListener('click', () => {
            combosOverlay!.style.display = 'none';
        });
        header.appendChild(closeBtn);
        panel.appendChild(header);

        const tipHover = (cell: HTMLElement, item: ItemDef) => {
            cell.addEventListener('mouseenter', () => {
                combosTip!.innerHTML = itemTooltipHtml(item);
            });
            cell.addEventListener('mouseleave', () => {
                combosTip!.innerHTML = combosTipIdle;
            });
        };
        const iconCell = (item: ItemDef, isHeader: boolean) => {
            const cell = div(
                `display:flex;align-items:center;justify-content:center;cursor:default;border-radius:8px;` +
                    (isHeader
                        ? `background:#00000044;border:1px solid ${item.color}66;`
                        : `background:#ffffff08;border:1px solid ${THEME.line};`),
                itemIcon(item, 40),
            );
            tipHover(cell, item);
            hover(cell, { transform: 'scale(1.12)', borderColor: item.color });
            return cell;
        };

        const grid = div(
            `display:grid;grid-template-columns:repeat(${COMPONENTS.length + 1},56px);grid-auto-rows:56px;gap:6px;`,
        );
        grid.appendChild(div(''));
        for (const comp of COMPONENTS) grid.appendChild(iconCell(comp, true));
        for (const rowComp of COMPONENTS) {
            grid.appendChild(iconCell(rowComp, true));
            for (const colComp of COMPONENTS) {
                grid.appendChild(
                    iconCell(combineItems(rowComp.id, colComp.id)!, false),
                );
            }
        }
        panel.appendChild(grid);
        wrap.appendChild(panel);

        combosTip = div(
            `width:300px;padding:13px 14px;background:rgba(13,26,36,.96);border:1px solid ${THEME.line};` +
                `clip-path:${bevel(12)};box-shadow:0 16px 40px rgba(0,0,0,.55);`,
            combosTipIdle,
        );
        wrap.appendChild(combosTip);
        combosOverlay.appendChild(wrap);
        rootEl.appendChild(combosOverlay);
    };
    combosBtn.addEventListener('click', () => {
        if (!combosOverlay) buildCombosOverlay();
        combosOverlay!.style.display =
            combosOverlay!.style.display === 'flex' ? 'none' : 'flex';
    });

    // ── Debug: free-unit picker ─────────────────────────────────────────
    // Built lazily on first open. Every roster unit is a clickable card that
    // grants a free copy to the bench (running the normal combine cascade).
    let debugOverlay: HTMLDivElement | null = null;

    const buildDebugOverlay = () => {
        debugOverlay = div(
            `position:absolute;inset:0;display:none;align-items:center;justify-content:center;` +
                `background:rgba(3,7,11,.72);pointer-events:auto;z-index:300;`,
        );
        debugOverlay.addEventListener('mousedown', (e) => {
            if (e.target === debugOverlay) debugOverlay!.style.display = 'none';
        });
        const panel = div(
            `display:flex;flex-direction:column;gap:12px;max-height:82vh;padding:16px 18px 18px;` +
                `background:rgba(9,18,26,.96);border:1px solid ${THEME.gold};clip-path:${bevel(14)};` +
                `box-shadow:0 20px 70px rgba(0,0,0,.6);animation:ovcSlideUp .25s ease;`,
        );
        const header = div(`display:flex;align-items:center;gap:10px;`);
        header.appendChild(
            div(
                `font-family:${FONTS.display};font-size:22px;font-weight:600;letter-spacing:2px;color:${THEME.gold};line-height:1;`,
                'DEBUG · FREE UNITS',
            ),
        );
        const closeBtn = div(
            `margin-left:auto;width:24px;height:24px;display:flex;align-items:center;justify-content:center;` +
                `border:1px solid ${THEME.line};border-radius:6px;color:${THEME.dim};font-size:12px;font-weight:700;cursor:pointer;`,
            '✕',
        );
        hover(closeBtn, { borderColor: THEME.enemy, color: THEME.enemy });
        closeBtn.addEventListener('click', () => {
            debugOverlay!.style.display = 'none';
        });
        header.appendChild(closeBtn);
        panel.appendChild(header);

        const grid = div(
            `display:grid;grid-template-columns:repeat(6,88px);gap:8px;overflow-y:auto;padding-right:4px;`,
        );
        const roster = [...SHOP_UNITS].sort(
            (a, b) => a.cost - b.cost || a.name.localeCompare(b.name),
        );
        for (const def of roster) {
            const [border] = COST_COLORS[def.cost] ?? ['#7d8790', '#8f9aa3'];
            const cell = div(
                `display:flex;flex-direction:column;align-items:center;gap:2px;padding:4px 3px 5px;cursor:pointer;` +
                    `background:#ffffff08;border:1px solid ${border};border-radius:8px;`,
                `<img src="${unitPortrait(renderer, def)}" width="70" height="55" style="object-fit:contain;pointer-events:none" />` +
                    `<span style="font-size:10px;font-weight:700;color:${THEME.text};line-height:1.1;text-align:center">${def.name}</span>` +
                    `<span style="font-size:9px;color:${THEME.gold}">${def.cost}g</span>`,
            );
            hover(cell, { transform: 'scale(1.06)', background: '#ffffff18' });
            cell.addEventListener('click', () => {
                if (state.phase !== 'prep') {
                    errorSfx.play();
                    return;
                }
                if (debugGrantUnit(state.run, def.id)) {
                    buySfx.play();
                    state.revision++;
                } else errorSfx.play();
            });
            grid.appendChild(cell);
        }
        panel.appendChild(grid);
        debugOverlay.appendChild(panel);
        rootEl.appendChild(debugOverlay);
    };
    debugBtn.addEventListener('click', () => {
        if (!debugOverlay) buildDebugOverlay();
        debugOverlay!.style.display =
            debugOverlay!.style.display === 'flex' ? 'none' : 'flex';
    });

    // ── Item drag-to-equip ──────────────────────────────────────────────
    // The tray owns the gesture: a ghost icon follows the pointer while
    // InteractionNode keeps updating `hoverUid`; release equips onto it.
    let dragGhost: HTMLDivElement | null = null;
    // The ghost lives inside the zoomed HUD root, so visual-pixel pointer
    // coords must be divided back into the zoomed coordinate space.
    const onItemDragMove = (e: PointerEvent) => {
        if (dragGhost) {
            dragGhost.style.left = `${e.clientX / UI_SCALE}px`;
            dragGhost.style.top = `${e.clientY / UI_SCALE}px`;
        }
    };
    const onItemDragEnd = () => {
        window.removeEventListener('pointermove', onItemDragMove);
        window.removeEventListener('pointerup', onItemDragEnd);
        dragGhost?.remove();
        dragGhost = null;
        const itemId = state.dragItem;
        state.dragItem = null;
        if (!itemId || state.phase !== 'prep') return;
        const uid = state.hoverUid;
        if (!uid) return;
        if (equipItem(state.run, uid, itemId)) {
            equipSfx.play();
            state.revision++;
        } else {
            errorSfx.play();
        }
    };
    const startItemDrag = (item: ItemDef, e: PointerEvent) => {
        if (state.phase !== 'prep' || state.dragItem || state.dragUid) return;
        state.dragItem = item.id;
        itemTip.style.display = 'none';
        dragGhost = div(
            `position:fixed;left:${e.clientX / UI_SCALE}px;top:${e.clientY / UI_SCALE}px;transform:translate(-50%,-50%);` +
                `pointer-events:none;z-index:400;filter:drop-shadow(0 5px 12px rgba(0,0,0,.65));`,
            itemIcon(item, 34),
        );
        rootEl.appendChild(dragGhost);
        window.addEventListener('pointermove', onItemDragMove);
        window.addEventListener('pointerup', onItemDragEnd);
    };
    useDestroy(() => {
        window.removeEventListener('pointermove', onItemDragMove);
        window.removeEventListener('pointerup', onItemDragEnd);
        dragGhost?.remove();
    });

    // Result overlay (above the combos chart, which is z-index 300).
    const overlay = div(
        `position:absolute;inset:0;display:none;align-items:center;justify-content:center;background:rgba(3,7,11,.62);pointer-events:auto;z-index:320;`,
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
                        `flex:1;max-width:142px;height:138px;border:1px dashed ${THEME.line};clip-path:${bevel(10)};opacity:.35;`,
                    ),
                );
                return;
            }
            const [border, top] = COST_COLORS[def.cost];
            const canBuy = state.phase === 'prep' && state.run.gold >= def.cost;
            const portrait = unitPortrait(renderer, def);
            const chips =
                archetypeChip(def, 9.5) +
                defTraits(def)
                    .map(
                        (t) =>
                            `<span style="font-size:9.5px;font-weight:600;color:${t.color};background:#00000044;padding:1px 5px;border-radius:4px">${t.name}</span>`,
                    )
                    .join('');
            const card = div(
                `flex:1;max-width:142px;background:rgba(13,26,36,.86);border:1px solid ${border};border-top:3px solid ${top};` +
                    `overflow:hidden;backdrop-filter:blur(9px);clip-path:${bevel(10)};cursor:${canBuy ? 'pointer' : 'default'};` +
                    `opacity:${canBuy ? 1 : 0.55};${def.cost >= 4 ? `box-shadow:0 0 18px ${top}44;` : ''}`,
                `<div style="height:74px;background:linear-gradient(160deg,${top}2e,#0a121b);position:relative;overflow:hidden">` +
                    `<div style="position:absolute;inset:0;background-image:url(${portrait});background-size:contain;background-position:center 62%;background-repeat:no-repeat"></div></div>` +
                    `<div style="padding:5px 7px 7px">` +
                    `<div style="display:flex;justify-content:space-between;align-items:center">` +
                    `<span style="font-size:12px;font-weight:700;color:${THEME.text}">${def.name}</span>` +
                    `<span style="display:flex;align-items:center;gap:3px"><span style="width:9px;height:9px;border-radius:50%;background:${THEME.gold}"></span>` +
                    `<span style="font-family:${FONTS.display};font-size:12px;font-weight:700;color:${THEME.gold}">${def.cost}</span></span></div>` +
                    `<div style="display:flex;gap:4px;margin-top:4px;flex-wrap:wrap">` +
                    chips +
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

    /** Tooltip body for one synergy row: tiers + roster with field state. */
    const synergyTipHtml = (row: TraitCount) => {
        const trait = TRAIT_BY_ID.get(row.id)!;
        const axisLabel =
            trait.axis === 'manufacturer'
                ? 'Manufacturer'
                : trait.axis === 'role'
                  ? 'Role'
                  : 'Prime';
        const tiers = trait.tiers
            .map((t, i) => {
                const on = i === row.tier;
                return (
                    `<div style="display:flex;gap:8px;align-items:baseline;padding:4px 8px;border-radius:5px;margin-top:2px;` +
                    (on
                        ? `background:${trait.color}1c;border:1px solid ${trait.color}66;`
                        : `border:1px solid transparent;opacity:.55;`) +
                    `"><span style="font-family:${FONTS.display};font-size:16px;font-weight:700;color:${on ? trait.color : THEME.dim};flex:none">(${t.count})</span>` +
                    `<span style="font-size:12.5px;line-height:1.35;color:${on ? THEME.text : THEME.dim}">${t.effect}</span></div>`
                );
            })
            .join('');
        const roster = UNITS.filter(
            (d) =>
                !d.token &&
                !d.enemyOnly &&
                (d.manufacturer === trait.id ||
                    d.role === trait.id ||
                    d.prime === trait.id),
        )
            .sort((a, b) => a.cost - b.cost)
            .map((d) => {
                const fielded = state.run.board.some((u) => u.defId === d.id);
                const [border] = COST_COLORS[d.cost];
                return (
                    `<span title="${d.name}" style="width:40px;height:40px;border-radius:7px;flex:none;` +
                    `border:1px solid ${fielded ? border : THEME.line};background:#00000044;` +
                    `display:flex;align-items:center;justify-content:center;overflow:hidden;` +
                    `${fielded ? '' : 'filter:grayscale(1);opacity:.4;'}">` +
                    `<img src="${unitPortrait(renderer, d)}" style="width:36px;height:36px;object-fit:contain"/></span>`
                );
            })
            .join('');
        return (
            `<div style="display:flex;align-items:center;gap:9px;margin-bottom:5px">` +
            `<span style="display:flex;flex:none">${traitIcon(trait.axis, trait.id, 25, trait.color)}</span>` +
            `<span style="font-family:${FONTS.display};font-size:21px;font-weight:600;color:${trait.color};line-height:1">${trait.name}</span>` +
            `<span style="margin-left:auto;font-size:10.5px;font-weight:700;letter-spacing:1.5px;color:${THEME.dim};text-transform:uppercase">${axisLabel}</span></div>` +
            `<div style="font-size:12.5px;line-height:1.4;color:${THEME.dim};margin-bottom:8px">${trait.description}</div>` +
            tiers +
            `<div style="font-size:10.5px;font-weight:700;letter-spacing:1.5px;color:${THEME.dim};text-transform:uppercase;margin:10px 0 6px">Constructs</div>` +
            `<div style="display:flex;gap:5px;flex-wrap:wrap">${roster}</div>`
        );
    };

    let lastSynergyKey = '';
    const renderSynergies = () => {
        const defs = state.run.board.map((u) => defOf(u));
        const key =
            [...new Set(defs.map((d) => d.id))].sort().join(',') + state.phase;
        if (key === lastSynergyKey) return;
        lastSynergyKey = key;
        // The rebuild wipes rows mid-hover: mouseleave never fires, so
        // reset the hover-driven state here.
        state.highlightTrait = null;
        synergyTip.style.display = 'none';
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
            const icon = traitIcon(
                trait.axis,
                trait.id,
                20,
                active ? trait.color : THEME.dim,
            );
            const next = trait.tiers.find((t) => row.count < t.count);
            const pips = active
                ? `<span style="display:flex;gap:3px">${`<span style="width:6px;height:6px;border-radius:50%;background:${trait.color}"></span>`.repeat(row.count)}</span>`
                : `<span style="font-size:11px;color:${THEME.dim}">${row.count}/${next?.count ?? ''}</span>`;
            const rowEl = div(
                `display:flex;align-items:center;gap:9px;padding:6px 9px;background:${active ? THEME.panel : 'rgba(13,26,36,.55)'};` +
                    `border:1px solid ${active ? trait.color : THEME.line};${active ? '' : 'opacity:.55;'}` +
                    `backdrop-filter:blur(8px);clip-path:${bevel(9)};cursor:help;`,
                `<span style="display:flex;width:22px;height:22px;align-items:center;justify-content:center;flex:none">${icon}</span>` +
                    `<span style="flex:1;min-width:0;font-size:13px;font-weight:${active ? 700 : 600};color:${
                        active ? THEME.text : THEME.dim
                    };white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${trait.name}</span>` +
                    pips,
            );
            rowEl.addEventListener('mouseenter', () => {
                synergyTip.innerHTML = synergyTipHtml(row);
                synergyTip.style.display = 'block';
                state.highlightTrait = trait.id;
            });
            rowEl.addEventListener('mouseleave', () => {
                synergyTip.style.display = 'none';
                if (state.highlightTrait === trait.id)
                    state.highlightTrait = null;
            });
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
        let itemIds: string[] = [];
        const own = allOwned(state.run).find((u) => u.uid === uid);
        if (own) {
            def = defOf(own);
            star = own.star;
            owned = true;
            itemIds = equippedItems(own);
        } else {
            const preview = state.wave.placements.find((p) => p.uid === uid);
            if (preview) {
                def = UNIT_BY_ID.get(preview.defId) ?? null;
                star = preview.star;
                itemIds = preview.items ?? [];
            } else if (state.combat) {
                const sim = state.combat.byUid.get(uid);
                if (sim) {
                    def = sim.def;
                    star = sim.star;
                    itemIds = sim.items.map((i) => i.id);
                }
            }
        }
        const key = def
            ? `${def.id}:${star}:${owned}:${itemIds.join(',')}`
            : '';
        if (key === lastTooltipKey) return;
        lastTooltipKey = key;
        if (!def) {
            tooltip.style.display = 'none';
            return;
        }
        const [, top] = COST_COLORS[def.cost];
        const arch = ARCHETYPE_BY_ID.get(def.archetype)!;
        const traitChips =
            archetypeChip(def, 12) +
            defTraits(def)
                .map(
                    (t) =>
                        `<span style="display:flex;align-items:center;gap:4px;font-size:12px;font-weight:600;color:${t.color};background:#00000044;padding:2px 8px;border-radius:5px">${traitIcon(t.axis, t.id, 13, t.color)}${t.name}</span>`,
                )
                .join('');
        const itemDefs = itemIds
            .map((id) => ITEM_BY_ID.get(id))
            .filter((i): i is ItemDef => !!i);
        const agg = aggregateItemStats(itemDefs);
        const inputs: ScalingInputs = {
            star,
            atk: starScale(def.stats.atk, star) + agg.atk,
            armor: def.stats.armor + agg.armor,
            maxHp: starScale(def.stats.hp, star) + agg.hp,
            ap: 1 + agg.ap,
        };
        const statCells = (
            [
                ['HP', inputs.maxHp, agg.hp > 0 ? STAT_COLORS.hp : THEME.text],
                ['ATK', inputs.atk, agg.atk > 0 ? STAT_COLORS.atk : THEME.text],
                [
                    'ARM',
                    inputs.armor,
                    agg.armor > 0 ? STAT_COLORS.armor : THEME.text,
                ],
                ['RNG', def.stats.range, THEME.text],
                [
                    'AP%',
                    Math.round(inputs.ap * 100),
                    agg.ap > 0 ? STAT_COLORS.ap : THEME.text,
                ],
            ] as const
        )
            .map(
                ([label, value, color]) =>
                    `<div style="flex:1;text-align:center">` +
                    `<div style="font-family:${FONTS.display};font-size:22px;font-weight:600;color:${color};line-height:1">${value}</div>` +
                    `<div style="font-size:10px;letter-spacing:1px;color:${THEME.dim};text-transform:uppercase">${label}</div></div>`,
            )
            .join('');
        const scalingRows =
            scalingRowHtml('Primary', def.ability.power, inputs) +
            (def.ability.secondary
                ? scalingRowHtml('Secondary', def.ability.secondary, inputs)
                : '');
        const itemSlots =
            owned || itemDefs.length > 0
                ? `<div style="display:flex;align-items:center;gap:6px;margin-top:10px">` +
                  `<span style="font-size:10.5px;font-weight:700;letter-spacing:1px;color:${THEME.dim};text-transform:uppercase;width:64px;flex:none">Items</span>` +
                  [0, 1, 2]
                      .map((i) => {
                          const it = itemDefs[i];
                          return it
                              ? `<span style="display:flex" title="${it.name} — ${it.description.replace(/"/g, '&quot;')}">${itemIcon(it, 26)}</span>`
                              : `<span style="width:21px;height:21px;border:1px dashed ${THEME.line};border-radius:5px;opacity:.55"></span>`;
                      })
                      .join('') +
                  `</div>`
                : '';
        tooltip.style.display = 'block';
        tooltip.innerHTML =
            `<div style="display:flex;align-items:center;gap:8px">` +
            `<span style="font-family:${FONTS.display};font-size:25px;font-weight:600;letter-spacing:.5px;color:${THEME.text};line-height:1">${def.name}</span>` +
            `<span style="display:flex;align-items:center;gap:3px;margin-left:auto">` +
            `<span style="font-size:11px;color:${THEME.gold}">${stars(star)}</span>` +
            `<span style="width:9px;height:9px;border-radius:50%;background:${top};margin-left:4px"></span>` +
            `<span style="font-family:${FONTS.display};font-size:16px;font-weight:600;color:${top}">${def.cost}</span></span></div>` +
            `<div style="display:flex;gap:5px;margin:8px 0 9px;flex-wrap:wrap">${traitChips}</div>` +
            `<div style="font-size:12px;letter-spacing:1px;color:${THEME.dim};text-transform:uppercase;margin-bottom:5px">${def.epithet}</div>` +
            `<div style="font-size:12px;line-height:1.4;color:${THEME.dim};margin-bottom:9px">${arch.description}</div>` +
            `<div style="background:#00000033;border:1px solid ${THEME.line};border-radius:8px;padding:9px 10px;margin-bottom:10px">` +
            `<div style="font-size:13.5px;font-weight:700;color:${THEME.accent};margin-bottom:3px">${def.ability.name}</div>` +
            `<div style="font-size:13px;line-height:1.35;color:${THEME.text};opacity:.86">${def.ability.description}</div>` +
            scalingRows +
            `</div>` +
            `<div style="display:flex;gap:6px">${statCells}</div>` +
            itemSlots +
            (owned && state.phase === 'prep'
                ? `<div style="margin-top:9px;font-size:11px;color:${THEME.dim}">Right-click to sell for ${sellValue(def.cost, star)}g · drag to reposition · drag items from the tray to equip</div>`
                : '');
    };

    let lastOverlayKey = '';
    const renderOverlay = () => {
        const ended = state.phase === 'victory' || state.phase === 'defeat';
        if (!ended) {
            if (lastOverlayKey !== '') {
                lastOverlayKey = '';
                overlay.style.display = 'none';
            }
            return;
        }
        // Rebuilds when a salvage pick resolves (the picker shrinks away).
        const key = `${state.phase}:${state.run.pendingSalvage.length}`;
        if (key === lastOverlayKey) return;
        lastOverlayKey = key;
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
                        ? `<div style="display:flex;align-items:center;gap:14px;font-size:14px;font-weight:600;color:${THEME.text}">` +
                          `<span style="color:${THEME.gold}">+${res.goldEarned} gold</span><span>+2 XP</span>` +
                          (res.augmentOffered
                              ? `<span style="color:${THEME.arcane}">Augment unlocked</span>`
                              : '') +
                          `</div>`
                        : `<div style="display:flex;gap:14px;font-size:14px;font-weight:600;color:${THEME.text}">` +
                          `<span style="color:${THEME.enemy}">${heartIcon(13, THEME.enemy)} -${res.coreDamage} core integrity</span></div>`
                    : ''),
        );

        // Salvage picker: one pick-1-of-3 per drop, before continuing.
        const options = won ? state.run.pendingSalvage[0] : undefined;
        if (options) {
            const remaining = state.run.pendingSalvage.length;
            panel.appendChild(
                div(
                    `font-size:11px;font-weight:700;letter-spacing:2.5px;color:${THEME.accent};text-transform:uppercase;margin-top:4px`,
                    `Salvage — choose 1 component${remaining > 1 ? ` (${remaining} picks)` : ''}`,
                ),
            );
            const cardRow = div(`display:flex;gap:10px;`);
            for (const id of options) {
                const item = ITEM_BY_ID.get(id)!;
                const card = div(
                    `width:158px;padding:12px 11px;display:flex;flex-direction:column;align-items:center;gap:7px;` +
                        `background:rgba(13,26,36,.9);border:1px solid ${item.color}66;clip-path:${bevel(10)};cursor:pointer;text-align:center;`,
                    `<span style="display:flex">${itemIcon(item, 40)}</span>` +
                        `<span style="font-family:${FONTS.display};font-size:17px;font-weight:600;color:${item.color};line-height:1">${item.name}</span>` +
                        `<span style="display:flex;gap:4px;flex-wrap:wrap;justify-content:center">${itemStatChips(item)}</span>` +
                        `<span style="font-size:11px;line-height:1.35;color:${THEME.dim}">${item.description}</span>`,
                );
                hover(card, {
                    borderColor: item.color,
                    transform: 'translateY(-3px)',
                });
                card.addEventListener('click', () => {
                    if (chooseSalvage(state.run, id)) {
                        equipSfx.play();
                        state.revision++;
                    }
                });
                cardRow.appendChild(card);
            }
            panel.appendChild(cardRow);
        } else {
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
        }
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
        phaseLine.innerHTML =
            `<span style="font-size:12px;font-weight:600;letter-spacing:2px;color:${THEME.dim};text-transform:uppercase">${
                state.phase === 'prep'
                    ? 'Preparation'
                    : state.phase === 'combat'
                      ? 'Combat Phase'
                      : 'Resolution'
            }</span>` + waveSuffix;

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

        renderReward();
        renderItems();
        renderShop();
        renderSynergies();
        renderTooltip();
        renderOverlay();
    });
}
