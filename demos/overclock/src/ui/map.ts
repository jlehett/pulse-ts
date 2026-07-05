import { FONTS, HEX_CLIP, THEME, bevel } from '../config/theme';
import type { MapNode, MapNodeType } from '../run/mapGen';
import { availableNodes } from '../run/mapGen';
import type { RunState } from '../run/runState';
import { div, hover, mountScreen } from './dom';
import { arrowIcon, heartIcon, nodeIcon } from './icons';

const NODE_META: Record<
    MapNodeType,
    {
        name: string;
        color: string;
        desc: string;
        diff: number;
        rewards: string[];
    }
> = {
    battle: {
        name: 'Battle',
        color: THEME.accent,
        desc: 'A standard hostile garrison. Clear every enemy construct for gold and experience.',
        diff: 2,
        rewards: ['Gold', 'XP'],
    },
    elite: {
        name: 'Elite Encounter',
        color: THEME.enemy,
        desc: 'A reinforced enemy force. Higher risk — victory also grants an augment.',
        diff: 3,
        rewards: ['Gold +', 'Augment'],
    },
    event: {
        name: 'Signal Event',
        color: THEME.arcane,
        desc: 'An unknown transmission. Choose your response; outcomes range from boon to ambush.',
        diff: 1,
        rewards: ['Unknown'],
    },
    boss: {
        name: 'Act Guardian',
        color: THEME.boss,
        desc: 'The act guardian construct. Defeat it to complete the act and win the run.',
        diff: 4,
        rewards: ['Victory'],
    },
};

type NodeState = 'done' | 'current' | 'available' | 'locked' | 'skip';

const MAP_W = 1320;
const MAP_H = 500;

/**
 * Shows the act map and resolves with the node the player embarks to.
 *
 * @param container - Element to mount into.
 * @param run - Current run state (read-only here; caller applies embark).
 */
export function showMapScreen(
    container: HTMLElement,
    run: RunState,
): Promise<string> {
    return new Promise((resolve) => {
        const { root, dispose } = mountScreen(
            container,
            `display:flex;flex-direction:column;background:radial-gradient(130% 90% at 50% -12%, #12283a 0%, ${THEME.bg} 62%);color:${THEME.text};`,
        );

        const finish = (nodeId: string) => {
            dispose();
            resolve(nodeId);
        };

        // ── Node states ────────────────────────────────────────────────
        const visited: string[] = [...run.completedNodes];
        if (run.currentNodeId && !visited.includes(run.currentNodeId)) {
            visited.push(run.currentNodeId);
        }
        const available = new Set(availableNodes(run.map, run.currentNodeId));
        const currentFloor = run.currentNodeId
            ? run.map.nodes.find((n) => n.id === run.currentNodeId)!.floor
            : -1;

        const stateOf = (node: MapNode): NodeState => {
            if (node.id === run.currentNodeId) {
                return run.completedNodes.includes(node.id)
                    ? 'done'
                    : 'current';
            }
            if (run.completedNodes.includes(node.id)) return 'done';
            if (available.has(node.id)) return 'available';
            return node.floor <= currentFloor ? 'skip' : 'locked';
        };

        // The "current" node counts as done once resolved, but we still
        // want to show the marker where the player stands.
        const standingId = run.currentNodeId;

        // ── Top bar ────────────────────────────────────────────────────
        const panel = (css: string, html: string) =>
            div(
                `display:flex;align-items:center;gap:9px;padding:8px 13px;background:${THEME.panel};border:1px solid ${THEME.line};` +
                    `backdrop-filter:blur(9px);clip-path:${bevel(11)};${css}`,
                html,
            );
        const top = div(
            `display:flex;align-items:center;justify-content:space-between;padding:14px 20px;gap:16px;`,
        );
        const left = div(`display:flex;align-items:center;gap:10px;flex:1;`);
        left.appendChild(
            panel(
                '',
                `<span style="font-family:${FONTS.display};font-weight:600;font-size:20px;letter-spacing:2px;color:${THEME.accent};line-height:1">ACT I</span>` +
                    `<span style="width:1px;height:16px;background:${THEME.line}"></span>` +
                    `<span style="font-size:12px;font-weight:600;letter-spacing:1px;color:${THEME.dim}">FOUNDRY VERGE</span>`,
            ),
        );
        left.appendChild(
            panel(
                '',
                `${heartIcon(14, THEME.ally)}<div style="width:76px;height:6px;border-radius:3px;background:#00000066;overflow:hidden">` +
                    `<div style="height:100%;width:${run.core}%;background:linear-gradient(90deg,${THEME.ally},${THEME.accent});border-radius:3px"></div></div>` +
                    `<span style="font-family:${FONTS.display};font-size:14px;font-weight:600;color:${THEME.ally}">${run.core}</span>`,
            ),
        );
        left.appendChild(
            panel(
                `border-color:${THEME.gold};`,
                `<span style="width:13px;height:13px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff2c2,${THEME.gold});box-shadow:0 0 7px ${THEME.gold}"></span>` +
                    `<span style="font-family:${FONTS.display};font-weight:600;font-size:16px;color:${THEME.gold}">${run.gold}</span>`,
            ),
        );
        top.appendChild(left);
        top.appendChild(
            div(
                `text-align:center;flex:none;`,
                `<div style="font-family:${FONTS.display};font-size:30px;font-weight:600;letter-spacing:4px;color:#eaf6fb;line-height:1">CHART YOUR COURSE</div>` +
                    `<div style="font-size:12px;font-weight:600;letter-spacing:2.5px;color:${THEME.dim};text-transform:uppercase;margin-top:2px">Select the next node to travel to</div>`,
            ),
        );
        const right = div(
            `display:flex;align-items:center;gap:10px;flex:1;justify-content:flex-end;`,
        );
        right.appendChild(
            div(
                `display:flex;flex-direction:column;align-items:flex-end;padding:7px 13px;background:${THEME.panel};border:1px solid ${THEME.line};backdrop-filter:blur(9px);clip-path:${bevel(11)};`,
                `<span style="font-size:10px;font-weight:700;letter-spacing:2px;color:${THEME.dim};text-transform:uppercase">Floor</span>` +
                    `<span style="font-family:${FONTS.display};font-size:17px;font-weight:600;color:${THEME.text};line-height:1">${String(
                        Math.max(1, currentFloor + 2),
                    ).padStart(
                        2,
                        '0',
                    )} / ${String(run.map.floors).padStart(2, '0')}</span>`,
            ),
        );
        right.appendChild(
            div(
                `display:flex;flex-direction:column;align-items:flex-end;padding:7px 13px;background:${THEME.panel};border:1px solid ${THEME.line};backdrop-filter:blur(9px);clip-path:${bevel(11)};`,
                `<span style="font-size:10px;font-weight:700;letter-spacing:2px;color:${THEME.dim};text-transform:uppercase">Seed</span>` +
                    `<span style="font-family:${FONTS.mono};font-size:12px;font-weight:500;color:#8fb0c0;line-height:1.2">${run.seed}</span>`,
            ),
        );
        top.appendChild(right);
        root.appendChild(top);

        // ── Legend ─────────────────────────────────────────────────────
        const legend = div(
            `display:flex;justify-content:center;gap:9px;padding:0 0 4px;`,
        );
        for (const type of ['battle', 'elite', 'event', 'boss'] as const) {
            const meta = NODE_META[type];
            legend.appendChild(
                div(
                    `display:flex;align-items:center;gap:7px;background:rgba(13,26,36,.55);border:1px solid ${THEME.line};padding:5px 11px;clip-path:${bevel(8)};`,
                    `<span style="width:11px;height:11px;background:${meta.color};clip-path:${HEX_CLIP};${
                        type === 'boss'
                            ? `box-shadow:0 0 6px ${meta.color}`
                            : ''
                    }"></span><span style="font-size:12px;font-weight:600;color:#cfe6f0">${meta.name.split(' ')[0]}</span>`,
                ),
            );
        }
        root.appendChild(legend);

        // ── Map canvas ─────────────────────────────────────────────────
        const wrap = div(
            `flex:1;display:flex;align-items:center;justify-content:center;min-height:0;padding:0 30px;`,
        );
        root.appendChild(wrap);
        const scaleBox = div(`flex:none;position:relative;`);
        const inner = div(
            `position:relative;width:${MAP_W}px;height:${MAP_H}px;transform-origin:top left;`,
        );
        scaleBox.appendChild(inner);
        wrap.appendChild(scaleBox);

        const posOf = (node: MapNode): [number, number] => {
            const x = 60 + node.floor * ((MAP_W - 140) / (run.map.floors - 1));
            const laneCount = run.map.nodes.filter(
                (n) => n.floor === node.floor,
            ).length;
            const spacing =
                laneCount > 1 ? Math.min(150, 420 / (laneCount - 1)) : 0;
            const y = MAP_H / 2 + (node.lane - (laneCount - 1) / 2) * spacing;
            return [x, y];
        };

        // Edges (SVG).
        const svgNS = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(svgNS, 'svg');
        svg.setAttribute('width', String(MAP_W));
        svg.setAttribute('height', String(MAP_H));
        svg.style.cssText = `position:absolute;left:0;top:0;overflow:visible;pointer-events:none;`;
        const visitedEdges = new Set<string>();
        for (let i = 0; i < visited.length - 1; i++) {
            visitedEdges.add(`${visited[i]}->${visited[i + 1]}`);
        }
        for (const [fromId, toId] of run.map.edges) {
            const from = run.map.nodes.find((n) => n.id === fromId)!;
            const to = run.map.nodes.find((n) => n.id === toId)!;
            const [x1, y1] = posOf(from);
            const [x2, y2] = posOf(to);
            const dx = (x2 - x1) * 0.5;
            const path = document.createElementNS(svgNS, 'path');
            path.setAttribute(
                'd',
                `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`,
            );
            path.setAttribute('fill', 'none');
            const taken = visitedEdges.has(`${fromId}->${toId}`);
            const choice =
                fromId === standingId &&
                available.has(toId) &&
                stateOf(to) === 'available';
            if (taken) {
                path.setAttribute('stroke', THEME.accent);
                path.setAttribute('stroke-width', '3');
                path.setAttribute('opacity', '0.8');
            } else if (
                choice ||
                (standingId === null && available.has(toId) && from.floor === 0)
            ) {
                path.setAttribute('stroke', THEME.accent);
                path.setAttribute('stroke-width', '3');
                path.setAttribute('opacity', '0.95');
                path.setAttribute('stroke-dasharray', '1 10');
                path.setAttribute('stroke-linecap', 'round');
                path.style.animation = 'ovcDashFlow 0.8s linear infinite';
            } else if (
                to.floor <= currentFloor + 1 &&
                stateOf(from) !== 'locked'
            ) {
                path.setAttribute('stroke', '#5b7387');
                path.setAttribute('stroke-width', '2');
                path.setAttribute('opacity', '0.26');
                path.setAttribute('stroke-dasharray', '2 7');
            } else {
                path.setAttribute('stroke', '#2a4557');
                path.setAttribute('stroke-width', '2');
                path.setAttribute('opacity', '0.42');
            }
            svg.appendChild(path);
        }
        inner.appendChild(svg);

        // Detail panel (footer).
        const footer = div(`padding:6px 0 22px;`);
        root.appendChild(footer);

        let selected: MapNode | null = null;
        const nodeEls = new Map<string, HTMLDivElement>();

        const renderDetail = () => {
            footer.innerHTML = '';
            const holder = div(`display:flex;justify-content:center;`);
            footer.appendChild(holder);
            if (!selected) {
                holder.appendChild(
                    div(
                        `display:flex;align-items:center;gap:11px;background:rgba(13,26,36,.7);border:1px solid ${THEME.line};backdrop-filter:blur(10px);` +
                            `clip-path:${bevel(12)};padding:15px 24px;color:#7f9db0;font-weight:600;font-size:13px;letter-spacing:.5px;`,
                        `<span style="width:10px;height:10px;background:${THEME.accent};clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%);box-shadow:0 0 8px ${THEME.accent};animation:ovcPulseSoft 1.5s infinite"></span>` +
                            `Select a highlighted node to preview it, then Embark`,
                    ),
                );
                return;
            }
            const meta = NODE_META[selected.type];
            let pips = '';
            for (let i = 0; i < 4; i++) {
                const on = i < meta.diff;
                pips += `<span style="width:7px;height:7px;border-radius:50%;background:${
                    on ? meta.color : 'rgba(255,255,255,0.12)'
                };${on ? `box-shadow:0 0 5px ${meta.color}` : ''}"></span>`;
            }
            const chips = meta.rewards
                .map(
                    (r) =>
                        `<span style="font-size:11px;font-weight:600;color:${THEME.text};background:rgba(0,0,0,0.3);border:1px solid ${THEME.line};padding:3px 9px;clip-path:${bevel(6)}">${r}</span>`,
                )
                .join('');
            const card = div(
                `background:rgba(13,26,36,0.82);border:1px solid ${meta.color};backdrop-filter:blur(11px);clip-path:${bevel(15)};` +
                    `padding:15px 19px;width:650px;display:flex;gap:16px;align-items:center;box-shadow:0 14px 40px rgba(0,0,0,.5);animation:ovcSlideUp .2s ease;`,
                `<div style="width:60px;height:60px;flex:none;display:flex;align-items:center;justify-content:center">${nodeIcon(selected.type, 42, meta.color)}</div>` +
                    `<div style="flex:1;min-width:0">` +
                    `<div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">` +
                    `<span style="font-family:${FONTS.display};font-weight:600;font-size:23px;letter-spacing:.5px;color:${meta.color};line-height:1">${meta.name}</span>` +
                    `<span style="display:flex;gap:4px;align-items:center;margin-left:2px">${pips}</span></div>` +
                    `<div style="font-size:12.5px;line-height:1.4;color:${THEME.text};opacity:.85;margin-bottom:9px">${meta.desc}</div>` +
                    `<div style="display:flex;gap:7px;align-items:center"><span style="font-size:9px;font-weight:700;letter-spacing:1.5px;color:${THEME.dim};text-transform:uppercase">Reward</span>${chips}</div></div>`,
            );
            const embarkBtn = div(
                `flex:none;align-self:stretch;padding:0 22px;background:${meta.color};color:${THEME.inkOnAccent};font-weight:700;font-size:15px;` +
                    `letter-spacing:.5px;cursor:pointer;clip-path:${bevel(10)};display:flex;align-items:center;gap:6px;`,
                `Embark <span style="display:flex">${arrowIcon(16, THEME.inkOnAccent)}</span>`,
            );
            hover(embarkBtn, { filter: 'brightness(1.15)' });
            embarkBtn.addEventListener('click', () => finish(selected!.id));
            card.appendChild(embarkBtn);
            holder.appendChild(card);
        };

        // Node DOM is built ONCE; hover/selection updates only touch
        // transform/filter/stroke. Rewriting innerHTML from a mouseenter
        // handler retriggers hover on the recreated children and the
        // browser loops enter/leave forever, eating clicks.
        const buildNode = (node: MapNode): HTMLDivElement => {
            const st = stateOf(node);
            const meta = NODE_META[node.type];
            const size =
                node.type === 'boss'
                    ? 88
                    : node.id === standingId
                      ? 68
                      : st === 'available'
                        ? 60
                        : st === 'done'
                          ? 50
                          : 48;
            const dim = st === 'locked' || st === 'skip';
            const fill = dim
                ? '#141f2a'
                : st === 'done'
                  ? 'rgba(20,32,44,0.85)'
                  : `${meta.color}26`;
            const iconColor = dim
                ? '#6f8698'
                : st === 'done'
                  ? '#9fb6c6'
                  : meta.color;
            const check =
                st === 'done'
                    ? `<span style="position:absolute;right:-3px;top:-3px;width:18px;height:18px;border-radius:50%;background:${THEME.good};display:flex;align-items:center;justify-content:center;box-shadow:0 0 6px ${THEME.good}">` +
                      `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#04140b" stroke-width="3.5"><path d="M5 12l4 4 10-10"/></svg></span>`
                    : '';
            const [x, y] = posOf(node);
            const elNode = div(
                `position:absolute;left:${x - size / 2}px;top:${y - size / 2}px;width:${size}px;height:${size}px;` +
                    `transition:transform .16s ease, filter .2s;cursor:${st === 'available' ? 'pointer' : 'default'};`,
                `<svg width="${size}" height="${size}" viewBox="0 0 100 100" style="display:block">` +
                    `<polygon points="50,4 96,27 96,73 50,96 4,73 4,27" fill="#0a121b"/>` +
                    `<polygon data-border points="50,4 96,27 96,73 50,96 4,73 4,27" fill="${fill}" stroke-width="4"/></svg>` +
                    `<span style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none">${nodeIcon(
                        node.type,
                        Math.round(size * 0.42),
                        iconColor,
                    )}</span>` +
                    check,
            );
            return elNode;
        };

        const updateNodeVisual = (node: MapNode, hovered: boolean) => {
            const elNode = nodeEls.get(node.id)!;
            const st = stateOf(node);
            const meta = NODE_META[node.type];
            const isSel = selected?.id === node.id;
            const dim = st === 'locked' || st === 'skip';
            const glow =
                st === 'available'
                    ? `drop-shadow(0 0 7px ${meta.color})`
                    : node.id === standingId || isSel
                      ? `drop-shadow(0 0 9px ${meta.color})`
                      : 'none';
            const scale =
                hovered && st === 'available' ? 1.13 : isSel ? 1.07 : 1;
            elNode.style.transform = `scale(${scale})`;
            elNode.style.filter = glow;
            elNode.style.zIndex = node.id === standingId || isSel ? '3' : '2';
            const border = elNode.querySelector('[data-border]');
            if (border) {
                border.setAttribute(
                    'stroke',
                    isSel ? '#ffffff' : dim ? '#3c5566' : meta.color,
                );
            }
        };

        for (const node of run.map.nodes) {
            const elNode = buildNode(node);
            nodeEls.set(node.id, elNode);
            inner.appendChild(elNode);
            const st = stateOf(node);
            if (st === 'available') {
                elNode.addEventListener('mouseenter', () =>
                    updateNodeVisual(node, true),
                );
                elNode.addEventListener('mouseleave', () =>
                    updateNodeVisual(node, false),
                );
                elNode.addEventListener('click', () => {
                    selected = node;
                    for (const n of run.map.nodes) updateNodeVisual(n, false);
                    renderDetail();
                });
            }
            updateNodeVisual(node, false);

            if (node.id === standingId) {
                const [x, y] = posOf(node);
                inner.appendChild(
                    div(
                        `position:absolute;left:${x - 48}px;top:${y + 40}px;width:96px;text-align:center;font-weight:700;font-size:9px;` +
                            `letter-spacing:1.5px;color:${NODE_META[node.type].color};text-transform:uppercase;animation:ovcPulseSoft 1.6s infinite;`,
                        'You are here',
                    ),
                );
            }
        }

        renderDetail();

        // Fit map to viewport.
        const rescale = () => {
            const w = wrap.clientWidth - 24;
            const h = wrap.clientHeight - 8;
            const s = Math.max(0.1, Math.min(1, w / MAP_W, h / MAP_H));
            inner.style.transform = `scale(${s})`;
            scaleBox.style.width = `${MAP_W * s}px`;
            scaleBox.style.height = `${MAP_H * s}px`;
        };
        const ro = new ResizeObserver(rescale);
        ro.observe(wrap);
        requestAnimationFrame(rescale);
    });
}
