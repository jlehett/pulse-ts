import * as THREE from 'three';
import { useContext, useDestroy, useFrameUpdate } from '@pulse-ts/core';
import { useObject3D, useScreenProjection } from '@pulse-ts/three';
import { BattleCtx } from '../../contexts';
import { FONTS, THEME } from '../../config/theme';
import type { UnitDef } from '../../config/types';
import { UNIT_BY_ID, starScale } from '../../config/units';
import { defOf } from '../../run/runState';
import { cellToWorld } from '../../sim/grid';
import type { Team } from '../../sim/types';
import { BENCH_Z, HEX_R, benchSlotX } from '../arena/ArenaNode';
import { buildRobot } from './robotMesh';

/** One tracked visual unit. */
interface Visual {
    key: string;
    uid: string;
    def: UnitDef;
    team: Team;
    star: number;
    group: THREE.Group;
    /** Desired ground position. */
    target: THREE.Vector3;
    /** Desired facing position (unit looks at this). */
    face: THREE.Vector3 | null;
    bench: boolean;
    bobPhase: number;
    /** Brief scale pulse (attack/cast feedback). */
    pulse: number;
    bar: HTMLDivElement;
    hpFill: HTMLDivElement;
    shieldFill: HTMLDivElement;
    manaFill: HTMLDivElement;
    label: HTMLDivElement;
}

/** Imperative handle for VFX/interactions. */
export interface UnitsHandle {
    /** World anchor of a unit (chest height), or null. */
    anchorOf(uid: string): THREE.Vector3 | null;
    /** Triggers a quick scale pulse (attack/cast feedback). */
    pulse(uid: string): void;
    /** Unit groups for raycast picking (userData.uid set). */
    groups(): THREE.Group[];
}

const LERP_SPEED = 10;

/**
 * Keeps robot visuals and their DOM nameplates in sync with the battle
 * state: run board/bench + enemy preview during prep, live sim units
 * during combat. Movement between cells is smoothed.
 */
export function UnitsNode(): UnitsHandle {
    const state = useContext(BattleCtx);
    const root = new THREE.Group();
    useObject3D(root);
    const project = useScreenProjection();

    // DOM layer for health bars / nameplates.
    const layer = document.createElement('div');
    layer.style.cssText =
        'position:fixed;inset:0;pointer-events:none;overflow:hidden;z-index:50;';
    document.body.appendChild(layer);
    useDestroy(() => layer.remove());

    const visuals = new Map<string, Visual>();

    const makeBar = (
        v: Omit<Visual, 'bar' | 'hpFill' | 'shieldFill' | 'manaFill' | 'label'>,
    ) => {
        const bar = document.createElement('div');
        const teamColor = v.team === 'player' ? THEME.ally : THEME.enemy;
        bar.style.cssText =
            'position:absolute;left:0;top:0;transform:translate(-50%,-100%);width:64px;text-align:center;will-change:transform;';
        bar.innerHTML =
            `<div data-r="label" style="font:700 8.5px ${FONTS.body};letter-spacing:1px;color:${teamColor};text-shadow:0 1px 3px #000;white-space:nowrap"></div>` +
            `<div style="position:relative;height:5px;background:rgba(0,0,0,.55);border:1px solid rgba(255,255,255,.18);border-radius:2px;overflow:hidden;margin-top:1px">` +
            `<div data-r="hp" style="position:absolute;left:0;top:0;bottom:0;width:100%;background:${teamColor}"></div>` +
            `<div data-r="shield" style="position:absolute;left:0;top:0;bottom:0;width:0;background:rgba(255,255,255,.75)"></div>` +
            `</div>` +
            `<div style="position:relative;height:3px;background:rgba(0,0,0,.55);border-radius:2px;overflow:hidden;margin-top:1px">` +
            `<div data-r="mana" style="position:absolute;left:0;top:0;bottom:0;width:0;background:${THEME.arcane}"></div>` +
            `</div>`;
        layer.appendChild(bar);
        return {
            bar,
            label: bar.querySelector('[data-r="label"]') as HTMLDivElement,
            hpFill: bar.querySelector('[data-r="hp"]') as HTMLDivElement,
            shieldFill: bar.querySelector(
                '[data-r="shield"]',
            ) as HTMLDivElement,
            manaFill: bar.querySelector('[data-r="mana"]') as HTMLDivElement,
        };
    };

    /** Desired unit set for the current phase. */
    interface Desired {
        uid: string;
        def: UnitDef;
        team: Team;
        star: number;
        x: number;
        z: number;
        bench: boolean;
        face: THREE.Vector3 | null;
        snap?: boolean;
    }

    const desiredNow = (): Desired[] => {
        const out: Desired[] = [];
        if (state.phase === 'prep') {
            for (const unit of state.run.board) {
                const [x, z] = cellToWorld(unit.row, unit.col, HEX_R);
                out.push({
                    uid: unit.uid,
                    def: defOf(unit),
                    team: 'player',
                    star: unit.star,
                    x,
                    z,
                    bench: false,
                    face: null,
                });
            }
            state.run.bench.forEach((unit, i) => {
                out.push({
                    uid: unit.uid,
                    def: defOf(unit),
                    team: 'player',
                    star: unit.star,
                    x: benchSlotX(i),
                    z: BENCH_Z,
                    bench: true,
                    face: null,
                });
            });
            for (const p of state.wave.placements) {
                const def = UNIT_BY_ID.get(p.defId);
                if (!def) continue;
                const [x, z] = cellToWorld(p.row, p.col, HEX_R);
                out.push({
                    uid: p.uid,
                    def,
                    team: 'enemy',
                    star: p.star,
                    x,
                    z,
                    bench: false,
                    face: null,
                });
            }
        } else if (state.combat) {
            for (const unit of state.combat.units) {
                if (!unit.alive) continue;
                const [x, z] = cellToWorld(unit.row, unit.col, HEX_R);
                const target = unit.targetUid
                    ? state.combat.byUid.get(unit.targetUid)
                    : null;
                let face: THREE.Vector3 | null = null;
                if (target && target.alive) {
                    const [tx, tz] = cellToWorld(target.row, target.col, HEX_R);
                    face = new THREE.Vector3(tx, 0, tz);
                }
                out.push({
                    uid: unit.uid,
                    def: unit.def,
                    team: unit.team,
                    star: unit.star,
                    x,
                    z,
                    bench: false,
                    face,
                });
            }
            // Keep benched player units visible during combat.
            state.run.bench.forEach((unit, i) => {
                out.push({
                    uid: unit.uid,
                    def: defOf(unit),
                    team: 'player',
                    star: unit.star,
                    x: benchSlotX(i),
                    z: BENCH_Z,
                    bench: true,
                    face: null,
                });
            });
        }
        return out;
    };

    let time = 0;
    useFrameUpdate((dt) => {
        time += dt;
        const desired = desiredNow();
        const seen = new Set<string>();

        for (const d of desired) {
            seen.add(d.uid);
            const key = `${d.uid}:${d.star}:${d.team}:${d.bench ? 1 : 0}`;
            let v = visuals.get(d.uid);
            if (v && v.key !== key) {
                v.group.removeFromParent();
                v.bar.remove();
                visuals.delete(d.uid);
                v = undefined;
            }
            if (!v) {
                const group = buildRobot(d.def, d.team, d.star);
                if (d.bench) group.scale.multiplyScalar(0.62);
                group.position.set(d.x, 0.12, d.z);
                group.rotation.y = d.team === 'player' ? 0 : Math.PI;
                group.userData.uid = d.uid;
                // Team-colored ground ring: separates units from the board.
                const ring = new THREE.Mesh(
                    new THREE.RingGeometry(0.48, 0.6, 24),
                    new THREE.MeshBasicMaterial({
                        color:
                            d.team === 'player'
                                ? THEME.allyNum
                                : THEME.enemyNum,
                        transparent: true,
                        opacity: 0.65,
                        side: THREE.DoubleSide,
                        depthWrite: false,
                    }),
                );
                ring.rotation.x = -Math.PI / 2;
                ring.position.y = 0.02;
                group.add(ring);
                root.add(group);
                const partial = {
                    key,
                    uid: d.uid,
                    def: d.def,
                    team: d.team,
                    star: d.star,
                    group,
                    target: new THREE.Vector3(d.x, 0.12, d.z),
                    face: d.face,
                    bench: d.bench,
                    bobPhase: Math.random() * Math.PI * 2,
                    pulse: 0,
                };
                v = { ...partial, ...makeBar(partial) };
                v.label.textContent = `${'★'.repeat(d.star)} ${d.def.name}`;
                visuals.set(d.uid, v);
            }
            v.target.set(d.x, 0.12, d.z);
            v.face = d.face;
        }

        // Remove stale visuals (deaths, sold units).
        for (const [uid, v] of visuals) {
            if (!seen.has(uid)) {
                v.group.removeFromParent();
                v.bar.remove();
                visuals.delete(uid);
            }
        }

        // Animate.
        const dragUid = state.dragUid;
        for (const v of visuals.values()) {
            const lift = dragUid === v.uid ? 0.8 : 0;
            const hoverBob =
                v.def.role === 'swarm'
                    ? 0.12 * Math.sin(time * 2.4 + v.bobPhase) + 0.18
                    : 0;
            const goal = v.target.clone();
            if (dragUid === v.uid && state.dragWorld) {
                goal.set(state.dragWorld[0], 0.12, state.dragWorld[1]);
            }
            goal.y += lift + hoverBob;
            v.group.position.lerp(goal, Math.min(1, LERP_SPEED * dt));

            if (v.face) {
                const angle =
                    Math.atan2(
                        v.face.x - v.group.position.x,
                        v.face.z - v.group.position.z,
                    ) + Math.PI;
                const delta =
                    ((angle - v.group.rotation.y + Math.PI * 3) %
                        (Math.PI * 2)) -
                    Math.PI;
                v.group.rotation.y += delta * Math.min(1, 8 * dt);
            }

            // Idle spinners (saws, rotary cannons, rotors, catalyst rings).
            v.group.traverse((o) => {
                if (o.name === 'catalyst-orb') o.rotation.y += dt * 1.6;
                else if (o.name === 'catalyst-ring') o.rotation.z += dt * 0.9;
                else if (o.name === 'catalyst-ring-2') o.rotation.z -= dt * 1.3;
                else if (o.name === 'spin-gun') o.rotation.z += dt * 5;
                else if (o.name === 'spin-z') o.rotation.x += dt * 7;
                else if (o.name.startsWith('spin-rotor')) {
                    o.rotation.y += dt * 14;
                }
            });

            if (v.pulse > 0) {
                v.pulse = Math.max(0, v.pulse - dt * 4);
                const s = 1 + 0.12 * Math.sin((1 - v.pulse) * Math.PI);
                v.group.scale.setScalar(
                    (0.95 + v.def.cost * 0.06 + (v.star - 1) * 0.13) *
                        (v.bench ? 0.62 : 1) *
                        s,
                );
            }

            // Bars.
            const anchor = v.group.position.clone();
            anchor.y += v.bench ? 1.3 : 1.7;
            const screen = project(anchor);
            if (!screen.visible) {
                v.bar.style.display = 'none';
                continue;
            }
            v.bar.style.display = '';
            v.bar.style.transform = `translate(-50%,-100%) translate(${screen.x}px, ${screen.y}px)`;

            if (state.phase !== 'prep' && state.combat) {
                const sim = state.combat.byUid.get(v.uid);
                if (sim) {
                    const hpPct = (100 * sim.hp) / sim.maxHp;
                    const shieldPct = Math.min(
                        100,
                        (100 * sim.shield) / sim.maxHp,
                    );
                    v.hpFill.style.width = `${hpPct}%`;
                    v.shieldFill.style.left = `${hpPct}%`;
                    v.shieldFill.style.width = `${Math.min(shieldPct, 100 - hpPct)}%`;
                    v.manaFill.style.width = `${(100 * sim.mana) / sim.manaMax}%`;
                    continue;
                }
            }
            // Prep: full bars, mana shows starting charge.
            v.hpFill.style.width = '100%';
            v.shieldFill.style.width = '0';
            v.manaFill.style.width = `${(100 * v.def.stats.manaStart) / v.def.stats.manaMax}%`;
        }
    });

    return {
        anchorOf: (uid) => {
            const v = visuals.get(uid);
            if (!v) return null;
            const p = v.group.position.clone();
            p.y += 0.9;
            return p;
        },
        pulse: (uid) => {
            const v = visuals.get(uid);
            if (v) v.pulse = 1;
        },
        groups: () => [...visuals.values()].map((v) => v.group),
    };
}

/** Display stat block for tooltips (HP scaled by star). */
export function displayStats(
    def: UnitDef,
    star: number,
): {
    hp: number;
    atk: number;
} {
    return {
        hp: starScale(def.stats.hp, star),
        atk: starScale(def.stats.atk, star),
    };
}
