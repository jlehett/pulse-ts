import * as THREE from 'three';
import { useChild, useFixedUpdate, useProvideContext } from '@pulse-ts/core';
import { useSound } from '@pulse-ts/audio';
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
import { BOARD_ROWS, cellToWorld } from '../sim/grid';
import type { CombatEvent } from '../sim/types';
import { ArenaNode, HEX_R } from './arena/ArenaNode';
import { CameraNode } from './CameraNode';
import {
    attackFx,
    deathFx,
    healFx,
    hitFx,
    playAbilityFx,
    reviveFx,
    shieldFx,
    summonSpawnFx,
} from './fx/abilityFx';
import { FxNode } from './fx/FxNode';
import { HudNode } from './HudNode';
import { InteractionNode } from './InteractionNode';
import { accentOf } from './units/robotMesh';
import { UnitsNode } from './units/UnitsNode';

/** Audio flavor of an ability cast. */
type CastStyle = 'boom' | 'slash' | 'zap' | 'support';

/** Sound flavor per ability kind; unlisted kinds fall back to 'support'. */
const CAST_STYLE: Partial<Record<string, CastStyle>> = {
    strike: 'slash',
    flicker: 'slash',
    phantom: 'slash',
    reap: 'slash',
    feast: 'slash',
    guillotine: 'slash',
    rush: 'slash',
    gauntlet: 'slash',
    hook: 'slash',
    devour: 'slash',
    nova: 'boom',
    blast: 'boom',
    bounce: 'boom',
    concussive: 'boom',
    barrage: 'boom',
    shockwave: 'boom',
    ram: 'boom',
    well: 'boom',
    scorch: 'boom',
    emp: 'boom',
    chain: 'zap',
    echo: 'zap',
    snipe: 'zap',
    sweep: 'zap',
    overcharge: 'zap',
    drain: 'zap',
};

/** Kinds whose batch heal events mark the cast's visual targets. */
const HEAL_TARGET_KINDS = new Set([
    'triage',
    'cleanse',
    'rally',
    'valkyrie',
    'empower',
]);

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
        dragItem: null,
        dragWorld: null,
        hoverCell: null,
        hoverBench: false,
        hoverUid: null,
        highlightTrait: null,
        resolution: null,
        revision: 0,
    };
    useProvideContext(BattleCtx, state);

    // Dev-only introspection hook for debugging/driving the demo.
    if (import.meta.env.DEV) {
        (window as { __overclock?: BattleState }).__overclock = state;
    }

    useChild(CameraNode);
    const arena = ArenaNode();
    const units = UnitsNode({ arena });
    InteractionNode({ arena, units });
    const fx = FxNode({ units });

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
    const boomSfx = useSound('noise', {
        filter: 'lowpass',
        frequency: [520, 60],
        duration: 0.3,
        gain: 0.09,
        group: 'sfx',
    });
    const slashSfx = useSound('noise', {
        filter: 'highpass',
        frequency: [4200, 1500],
        duration: 0.09,
        gain: 0.05,
        group: 'sfx',
    });
    const zapSfx = useSound('arpeggio', {
        notes: [1567.98, 1174.66, 1760],
        interval: 0.02,
        duration: 0.07,
        gain: 0.05,
        group: 'sfx',
    });
    const deathSfx = useSound('noise', {
        filter: 'lowpass',
        frequency: [900, 120],
        duration: 0.28,
        gain: 0.08,
        group: 'sfx',
    });
    const reviveSfx = useSound('arpeggio', {
        notes: [523.25, 783.99, 1046.5],
        interval: 0.05,
        duration: 0.12,
        gain: 0.06,
        group: 'sfx',
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

    const castSounds: Record<CastStyle, { play: () => void }> = {
        boom: boomSfx,
        slash: slashSfx,
        zap: zapSfx,
        support: castSfx,
    };

    let lastHitSfx = 0;

    const drainEvents = (events: CombatEvent[]) => {
        const now = performance.now();
        // Ability hits/heals land in the same batch as their cast event.
        // Group them per caster so each cast draws one full composition
        // around the positions it actually affected.
        interface CastGroup {
            kind: string;
            caster: THREE.Vector3;
            targets: THREE.Vector3[];
        }
        const casts = new Map<string, CastGroup>();
        for (const e of events) {
            if (e.type !== 'cast') continue;
            const p = units.anchorOf(e.unit);
            if (p) casts.set(e.unit, { kind: e.kind, caster: p, targets: [] });
        }
        for (const e of events) {
            switch (e.type) {
                case 'attack': {
                    units.pulse(e.from);
                    units.trigger(e.from, 'attack');
                    const from = units.anchorOf(e.from);
                    const to = units.anchorOf(e.to);
                    const sim = state.combat?.byUid.get(e.from);
                    if (from && to && sim) {
                        attackFx(fx, from, to, e.ranged, accentOf(sim.def));
                    }
                    break;
                }
                case 'hit': {
                    const p = units.anchorOf(e.target);
                    if (p) {
                        const from = units.anchorOf(e.source);
                        hitFx(fx, p, from, e.crit || e.amount >= 250);
                        casts.get(e.source)?.targets.push(p);
                    }
                    if (now - lastHitSfx > 90) {
                        lastHitSfx = now;
                        hitSfx.play();
                    }
                    break;
                }
                case 'sweep': {
                    const caster = units.anchorOf(e.unit);
                    if (caster) {
                        const column: THREE.Vector3[] = [];
                        for (let row = 0; row < BOARD_ROWS; row++) {
                            const [x, z] = cellToWorld(row, e.col, HEX_R);
                            column.push(new THREE.Vector3(x, 0, z));
                        }
                        playAbilityFx(fx, 'sweep', {
                            caster,
                            targets: [],
                            column,
                        });
                    }
                    if (now - lastHitSfx > 90) {
                        lastHitSfx = now;
                        zapSfx.play();
                    }
                    break;
                }
                case 'shield': {
                    const p = units.anchorOf(e.unit);
                    if (p) shieldFx(fx, p);
                    break;
                }
                case 'death': {
                    const p = units.anchorOf(e.unit);
                    if (p) {
                        const sim = state.combat?.byUid.get(e.unit);
                        deathFx(fx, p, sim ? accentOf(sim.def) : 0xffffff);
                    }
                    deathSfx.play();
                    break;
                }
                case 'heal': {
                    const p = units.anchorOf(e.unit);
                    if (p) {
                        let claimed = false;
                        for (const c of casts.values()) {
                            if (HEAL_TARGET_KINDS.has(c.kind)) {
                                c.targets.push(p);
                                claimed = true;
                            }
                        }
                        if (!claimed) healFx(fx, p);
                    }
                    break;
                }
                case 'revive': {
                    const p = units.anchorOf(e.unit);
                    if (p) reviveFx(fx, p);
                    reviveSfx.play();
                    break;
                }
                case 'summon': {
                    const p = units.anchorOf(e.unit);
                    if (p) summonSpawnFx(fx, p);
                    break;
                }
                default:
                    break;
            }
        }
        for (const [uid, c] of casts) {
            units.pulse(uid);
            units.trigger(uid, 'cast');
            castSounds[CAST_STYLE[c.kind] ?? 'support'].play();
            // Sweep visuals are drawn per channel tick (`sweep` events).
            if (c.kind === 'sweep') continue;
            playAbilityFx(fx, c.kind, { caster: c.caster, targets: c.targets });
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
        arena.setRimIntensity(2.8);
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
        const resolution = resolveBattle(state.run, won, survivors);
        state.resolution = {
            goldEarned: resolution.goldEarned,
            coreDamage: resolution.coreDamage,
            augmentOffered: resolution.augmentOffered,
            salvageChoices: resolution.salvageChoices,
        };
        state.phase = won ? 'victory' : 'defeat';
        state.revision++;
        arena.setRimIntensity(2.0);
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
