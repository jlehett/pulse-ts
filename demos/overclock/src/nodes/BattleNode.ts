import * as THREE from 'three';
import {
    useChild,
    useFixedUpdate,
    useFrameUpdate,
    useProvideContext,
} from '@pulse-ts/core';
import { useObject3D } from '@pulse-ts/three';
import { useSound } from '@pulse-ts/audio';
import { installParticles, useParticleBurst } from '@pulse-ts/effects';
import { COMBAT_TIME_LIMIT } from '../config/economy';
import { BattleCtx, type BattleState } from '../contexts';
import type { MapNode } from '../run/mapGen';
import { saveRun } from '../run/persistence';
import {
    activeAugments,
    playerPlacements,
    resolveBattle,
    waveForNode,
    type RunState,
} from '../run/runState';
import { createRng, type Rng } from '../run/rng';
import { createCombat, stepCombat } from '../sim/combat';
import type { CombatEvent } from '../sim/types';
import { ArenaNode } from './arena/ArenaNode';
import { CameraNode } from './CameraNode';
import { HudNode } from './HudNode';
import { InteractionNode } from './InteractionNode';
import { accentOf } from './units/robotMesh';
import { UnitsNode } from './units/UnitsNode';

/** Props for the battle orchestrator. */
export interface BattleProps {
    run: RunState;
    node: MapNode;
    /** Called when the battle visit is over (won, lost, or run ended). */
    onComplete: () => void;
}

/**
 * Orchestrates one battle-node visit: prep phase (shop + positioning),
 * the combat sim playback with VFX/audio, and result resolution.
 */
export function BattleNode(props: BattleProps): void {
    const state: BattleState = {
        run: props.run,
        node: props.node,
        wave: waveForNode(props.node),
        phase: 'prep',
        combat: null,
        timeLeft: COMBAT_TIME_LIMIT,
        dragUid: null,
        dragWorld: null,
        hoverCell: null,
        hoverBench: false,
        hoverUid: null,
        resolution: null,
        revision: 0,
    };
    useProvideContext(BattleCtx, state);

    // Dev-only introspection hook for debugging/driving the demo.
    const meta = import.meta as { env?: { DEV?: boolean } };
    if (meta.env?.DEV) {
        (window as { __overclock?: BattleState }).__overclock = state;
    }

    installParticles({ maxPerPool: 2048 });
    useChild(CameraNode);
    const arena = ArenaNode();
    const units = UnitsNode();
    InteractionNode({ arena, units });

    // ── Combat VFX ──────────────────────────────────────────────────────
    const hitBurst = useParticleBurst({
        count: 14,
        lifetime: 0.38,
        color: 0xbfe9f7,
        speed: [2.2, 5],
        gravity: 4,
        size: 0.1,
        blending: 'additive',
        shrink: true,
    });
    const critBurst = useParticleBurst({
        count: 26,
        lifetime: 0.5,
        color: 0xfff2c2,
        speed: [3, 7],
        gravity: 4,
        size: 0.12,
        blending: 'additive',
        shrink: true,
    });
    const castBurst = useParticleBurst({
        count: 22,
        lifetime: 0.55,
        color: 0xb45cff,
        speed: [1.5, 4.5],
        gravity: -0.5,
        size: 0.09,
        blending: 'additive',
        shrink: true,
    });
    const shieldBurst = useParticleBurst({
        count: 14,
        lifetime: 0.5,
        color: 0x38e8ff,
        speed: [0.8, 2.2],
        gravity: -1.2,
        size: 0.08,
        blending: 'additive',
        shrink: true,
    });
    const deathBurstAlly = useParticleBurst({
        count: 30,
        lifetime: 0.7,
        color: 0x33d6ff,
        speed: [2, 6],
        gravity: 5,
        size: 0.1,
        blending: 'additive',
        shrink: true,
    });
    const deathBurstEnemy = useParticleBurst({
        count: 30,
        lifetime: 0.7,
        color: 0xff5d6c,
        speed: [2, 6],
        gravity: 5,
        size: 0.1,
        blending: 'additive',
        shrink: true,
    });
    const goldBurst = useParticleBurst({
        count: 12,
        lifetime: 0.6,
        color: 0xffcf5c,
        speed: [1.5, 3.5],
        gravity: 6,
        size: 0.09,
        blending: 'additive',
        shrink: true,
    });

    // ── Combat audio ────────────────────────────────────────────────────
    const hitSfx = useSound('noise', {
        filter: 'bandpass',
        frequency: [1800, 500],
        duration: 0.07,
        gain: 0.045,
        group: 'sfx',
    });
    const castSfx = useSound('arpeggio', {
        notes: [392, 523.25, 659.25],
        interval: 0.035,
        duration: 0.12,
        gain: 0.06,
        group: 'sfx',
    });
    const deathSfx = useSound('noise', {
        filter: 'lowpass',
        frequency: [900, 120],
        duration: 0.28,
        gain: 0.08,
        group: 'sfx',
    });
    const goldSfx = useSound('arpeggio', {
        notes: [1046.5, 1318.5],
        interval: 0.05,
        duration: 0.1,
        gain: 0.06,
        group: 'ui',
    });
    const startSfx = useSound('arpeggio', {
        notes: [261.63, 329.63, 392, 523.25],
        interval: 0.06,
        duration: 0.18,
        gain: 0.09,
        group: 'ui',
    });
    const victorySfx = useSound('arpeggio', {
        notes: [392, 523.25, 659.25, 783.99, 1046.5],
        interval: 0.09,
        duration: 0.3,
        gain: 0.1,
        group: 'ui',
    });
    const defeatSfx = useSound('arpeggio', {
        notes: [311.13, 246.94, 196, 155.56],
        interval: 0.12,
        duration: 0.35,
        gain: 0.1,
        group: 'ui',
    });

    let lastHitSfx = 0;

    const at = (uid: string): [number, number, number] | null => {
        const p = units.anchorOf(uid);
        return p ? [p.x, p.y, p.z] : null;
    };

    // ── Tracer / beam FX layer ──────────────────────────────────────────
    const fxGroup = new THREE.Group();
    useObject3D(fxGroup);
    interface Tracer {
        mesh: THREE.Mesh;
        from: THREE.Vector3;
        to: THREE.Vector3;
        t: number;
        dur: number;
    }
    interface Beam {
        mesh: THREE.Mesh;
        t: number;
        dur: number;
    }
    const tracers: Tracer[] = [];
    const beams: Beam[] = [];
    const tracerGeo = new THREE.BoxGeometry(0.09, 0.09, 0.55);
    const beamGeo = new THREE.BoxGeometry(0.16, 0.16, 1);

    const spawnTracer = (fromUid: string, toUid: string) => {
        const from = units.anchorOf(fromUid);
        const to = units.anchorOf(toUid);
        const sim = state.combat?.byUid.get(fromUid);
        if (!from || !to || !sim) return;
        const mesh = new THREE.Mesh(
            tracerGeo,
            new THREE.MeshBasicMaterial({
                color: accentOf(sim.def),
                transparent: true,
                opacity: 0.95,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
            }),
        );
        mesh.position.copy(from);
        mesh.lookAt(to);
        fxGroup.add(mesh);
        tracers.push({
            mesh,
            from,
            to,
            t: 0,
            dur: Math.max(0.09, from.distanceTo(to) * 0.03),
        });
    };

    const spawnBeam = (casterUid: string) => {
        const sim = state.combat?.byUid.get(casterUid);
        const from = units.anchorOf(casterUid);
        if (!sim || !from || !sim.targetUid) return;
        const to = units.anchorOf(sim.targetUid);
        if (!to) return;
        const dir = to.clone().sub(from).normalize();
        const end = from.clone().addScaledVector(dir, 14);
        const mid = from.clone().add(end).multiplyScalar(0.5);
        const mesh = new THREE.Mesh(
            beamGeo,
            new THREE.MeshBasicMaterial({
                color: accentOf(sim.def),
                transparent: true,
                opacity: 0.9,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
            }),
        );
        mesh.position.copy(mid);
        mesh.lookAt(end);
        mesh.scale.z = from.distanceTo(end);
        fxGroup.add(mesh);
        beams.push({ mesh, t: 0, dur: 0.3 });
    };

    useFrameUpdate((dt) => {
        for (let i = tracers.length - 1; i >= 0; i--) {
            const tr = tracers[i];
            tr.t += dt;
            const k = Math.min(1, tr.t / tr.dur);
            tr.mesh.position.lerpVectors(tr.from, tr.to, k);
            if (k >= 1) {
                tr.mesh.removeFromParent();
                (tr.mesh.material as THREE.Material).dispose();
                tracers.splice(i, 1);
            }
        }
        for (let i = beams.length - 1; i >= 0; i--) {
            const b = beams[i];
            b.t += dt;
            const k = b.t / b.dur;
            (b.mesh.material as THREE.MeshBasicMaterial).opacity =
                0.9 * (1 - k);
            if (k >= 1) {
                b.mesh.removeFromParent();
                (b.mesh.material as THREE.Material).dispose();
                beams.splice(i, 1);
            }
        }
    });

    const drainEvents = (events: CombatEvent[]) => {
        const now = performance.now();
        for (const e of events) {
            switch (e.type) {
                case 'attack':
                    units.pulse(e.from);
                    if (e.ranged) spawnTracer(e.from, e.to);
                    break;
                case 'hit': {
                    const p = at(e.target);
                    if (p) (e.crit ? critBurst : hitBurst)(p);
                    if (now - lastHitSfx > 90) {
                        lastHitSfx = now;
                        hitSfx.play();
                    }
                    break;
                }
                case 'cast': {
                    const p = at(e.unit);
                    if (p) castBurst(p);
                    if (e.kind === 'pierce') spawnBeam(e.unit);
                    units.pulse(e.unit);
                    castSfx.play();
                    break;
                }
                case 'shield': {
                    const p = at(e.unit);
                    if (p) shieldBurst(p);
                    break;
                }
                case 'death': {
                    const p = at(e.unit);
                    if (p) {
                        const sim = state.combat?.byUid.get(e.unit);
                        (sim?.team === 'player'
                            ? deathBurstAlly
                            : deathBurstEnemy)(p);
                    }
                    deathSfx.play();
                    break;
                }
                case 'goldDrop': {
                    const p = at(e.unit);
                    if (p) goldBurst(p);
                    goldSfx.play();
                    break;
                }
                default:
                    break;
            }
        }
        events.length = 0;
    };

    // ── Phase control ───────────────────────────────────────────────────
    let combatRng: Rng | null = null;
    const startCombat = () => {
        if (state.phase !== 'prep' || state.run.board.length === 0) return;
        combatRng = createRng(state.run.rngState);
        state.combat = createCombat({
            player: playerPlacements(state.run),
            enemy: state.wave.placements,
            augments: activeAugments(state.run),
            enemyStatScale: state.wave.statScale,
            rng: combatRng.next,
        });
        state.phase = 'combat';
        state.timeLeft = COMBAT_TIME_LIMIT;
        arena.setRimIntensity(1.7);
        startSfx.play();
    };

    const endCombat = (won: boolean) => {
        const combat = state.combat!;
        const survivors = combat.units.filter(
            (u) => u.alive && u.team === 'enemy',
        ).length;
        if (combatRng) {
            state.run.rngState = combatRng.getState();
            combatRng = null;
        }
        const resolution = resolveBattle(
            state.run,
            won,
            survivors,
            combat.bonusGold,
        );
        state.resolution = {
            goldEarned: resolution.goldEarned,
            coreDamage: resolution.coreDamage,
            augmentOffered: resolution.augmentOffered,
        };
        state.phase = won ? 'victory' : 'defeat';
        state.revision++;
        arena.setRimIntensity(1.0);
        (won ? victorySfx : defeatSfx).play();
        saveRun(state.run);
    };

    useFixedUpdate((dt) => {
        if (state.phase !== 'combat' || !state.combat) return;
        stepCombat(state.combat, dt);
        state.timeLeft -= dt;
        drainEvents(state.combat.events);

        if (state.combat.phase !== 'running') {
            endCombat(state.combat.phase === 'playerWin');
        } else if (state.timeLeft <= 0) {
            state.combat.phase = 'enemyWin';
            endCombat(false);
        }
    });

    HudNode({
        onStartCombat: startCombat,
        onContinue: props.onComplete,
    });
}
