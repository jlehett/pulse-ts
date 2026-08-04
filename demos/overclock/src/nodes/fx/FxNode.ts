import * as THREE from 'three';
import { useContext, useDestroy, useFrameUpdate } from '@pulse-ts/core';
import { useObject3D, useThreeContext } from '@pulse-ts/three';
import { BattleCtx } from '../../contexts';
import type { UnitsHandle } from '../units/UnitsNode';
import { createFxEngine, type FxEngine } from './engine';

/** Props for the battle FX layer. */
export interface FxProps {
    /** Unit visuals, used to anchor effects to units. */
    units: UnitsHandle;
}

const UP = new THREE.Vector3(0, 1, 0);
const DOWN = new THREE.Vector3(0, -1, 0);

/**
 * Battle VFX layer: owns the {@link FxEngine} (updated every frame) and
 * emits looping status-effect particles (burn embers, stun stars, slow
 * drips, mark reticles, crackling buffs) by polling the live combat state.
 *
 * @param props - See {@link FxProps}.
 * @returns The {@link FxEngine} for event-driven effects.
 *
 * @example
 * const fx = FxNode({ units });
 * fx.burst(pos, { color: 0xffa14a });
 */
export function FxNode(props: FxProps): FxEngine {
    const state = useContext(BattleCtx);
    const { camera } = useThreeContext();
    const group = new THREE.Group();
    useObject3D(group);
    const fx = createFxEngine(group, camera);

    let acc = 0;
    let poll = 0;
    useFrameUpdate((dt) => {
        fx.update(dt);
        const combat = state.combat;
        if (!combat || state.phase !== 'combat') return;
        acc += dt;
        if (acc < 0.13) return;
        acc = 0;
        poll++;
        for (const u of combat.units) {
            if (!u.alive) continue;
            const p = props.units.anchorOf(u.uid);
            if (!p) continue;
            if (u.burnRemaining > 0) {
                fx.burst(new THREE.Vector3(p.x, p.y - 0.4, p.z), {
                    count: 3,
                    color: [0xffab40, 0xff5722],
                    endColor: 0x4e1500,
                    dir: UP,
                    spread: 0.6,
                    speed: [0.8, 1.6],
                    gravity: -1.4,
                    size: [0.14, 0.03],
                    life: [0.4, 0.7],
                    origin: 0.3,
                });
            }
            if (u.stunRemaining > 0) {
                fx.burst(new THREE.Vector3(p.x, p.y + 0.7, p.z), {
                    count: 2,
                    color: 0xffd23f,
                    speed: [0.5, 1.0],
                    gravity: 0,
                    drag: 2,
                    size: [0.16, 0.04],
                    life: [0.3, 0.5],
                    origin: 0.35,
                });
            }
            if (u.slowRemaining > 0) {
                fx.burst(new THREE.Vector3(p.x, p.y + 0.3, p.z), {
                    count: 2,
                    color: 0x7fd8ff,
                    dir: DOWN,
                    spread: 0.4,
                    speed: [0.6, 1.2],
                    gravity: 1.5,
                    size: [0.12, 0.03],
                    life: [0.4, 0.6],
                    origin: 0.3,
                });
            }
            if (u.discordRemaining > 0) {
                fx.burst(p, {
                    count: 2,
                    color: 0xb45cff,
                    dir: UP,
                    spread: 1.1,
                    speed: [0.4, 1.0],
                    gravity: -0.8,
                    size: [0.14, 0.03],
                    life: [0.4, 0.7],
                    origin: 0.35,
                });
            }
            if (u.markRemaining > 0 && poll % 4 === 0) {
                fx.ringWave(p, 0xff3b57, {
                    r0: 1.1,
                    r1: 0.35,
                    dur: 0.45,
                });
            }
            if (
                (u.empoweredAttacks > 0 || u.cleaveRemaining > 0) &&
                poll % 3 === 0
            ) {
                const a = Math.random() * Math.PI * 2;
                const tip = new THREE.Vector3(
                    p.x + Math.cos(a) * 0.6,
                    p.y + (Math.random() - 0.2) * 0.8,
                    p.z + Math.sin(a) * 0.6,
                );
                fx.bolt(p, tip, 0xffee58, {
                    jitter: 0.15,
                    thickness: 0.05,
                    dur: 0.1,
                });
            }
        }
    });

    useDestroy(() => fx.dispose());
    return fx;
}
