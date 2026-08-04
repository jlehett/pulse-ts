import * as THREE from 'three';
import {
    World,
    installDefaults,
    useChild,
    useFrameUpdate,
} from '@pulse-ts/core';
import { installThree, useObject3D, useThreeContext } from '@pulse-ts/three';
import { THEME } from '../config/theme';
import { ArenaNode, HEX_R } from '../nodes/arena/ArenaNode';
import { CameraNode } from '../nodes/CameraNode';
import { ABILITY_FX_KINDS, playAbilityFx } from '../nodes/fx/abilityFx';
import { createFxEngine } from '../nodes/fx/engine';
import { setupRenderer } from '../rendering/setupRenderer';
import { BOARD_ROWS, cellToWorld } from '../sim/grid';

/**
 * Dev-only ability-VFX lab (`?fxlab=<kind>`): renders the arena and
 * replays one ability's choreography on a short loop so effects can be
 * inspected (and screenshotted headlessly) in isolation.
 *
 * `?fxlab=all` cycles every kind; a comma list plays a subset. Add
 * `&slow=N` to dilate effect time N× so short-lived elements survive
 * headless frame sampling, or `&freeze=T` to cast once, deterministically
 * step the engine to exactly T seconds after the cast, and halt — any
 * sufficiently large `--virtual-time-budget` then captures that phase.
 */

/** Seconds between replays; screenshots time against this cadence. */
const LOOP_INTERVAL = 1.2;

const anchor = (row: number, col: number): THREE.Vector3 => {
    const [x, z] = cellToWorld(row, col, HEX_R);
    return new THREE.Vector3(x, 0.9, z);
};

interface FxLabProps {
    kind: string;
    /** Time-dilation factor; 1 = real time. */
    slow: number;
    /** Freeze phase in seconds-after-cast, or null to loop live. */
    freeze: number | null;
}

function FxLabNode(props: FxLabProps): void {
    useChild(CameraNode);
    ArenaNode();
    const { camera } = useThreeContext();
    const group = new THREE.Group();
    useObject3D(group);
    const fx = createFxEngine(group, camera);

    const kinds =
        props.kind === 'all'
            ? ABILITY_FX_KINDS
            : props.kind.split(',').filter(Boolean);
    const caster = anchor(5, 3);
    const targets = [anchor(3, 3), anchor(3, 2), anchor(2, 4)];
    const column: THREE.Vector3[] = [];
    for (let row = 0; row < BOARD_ROWS; row++) {
        const [x, z] = cellToWorld(row, 3, HEX_R);
        column.push(new THREE.Vector3(x, 0, z));
    }

    // On-screen readout so headless screenshots are self-describing.
    const label = document.createElement('div');
    label.style.cssText =
        'position:fixed;top:8px;left:8px;color:#fff;font:16px monospace;' +
        'background:rgba(0,0,0,0.6);padding:4px 8px;z-index:10;';
    document.body.appendChild(label);

    const cast = (kind: string) =>
        playAbilityFx(fx, kind, {
            caster,
            targets,
            column: kind === 'sweep' ? column : undefined,
        });

    let timer = 0.3;
    let index = 0;
    let sinceCast = 0;
    let current = '-';
    let frozen = false;
    useFrameUpdate((rawDt: number) => {
        if (props.freeze !== null) {
            if (frozen) return;
            frozen = true;
            current = kinds[0];
            cast(current);
            const step = 1 / 120;
            for (let t = 0; t < props.freeze; t += step) fx.update(step);
            label.textContent = `${current} @${props.freeze.toFixed(2)}s`;
            return;
        }
        const dt = rawDt / props.slow;
        fx.update(dt);
        sinceCast += dt;
        timer -= dt;
        if (timer <= 0) {
            timer = LOOP_INTERVAL;
            current = kinds[index % kinds.length];
            index++;
            sinceCast = 0;
            cast(current);
        }
        label.textContent = `${current} +${sinceCast.toFixed(2)}s`;
    });
}

/**
 * Boots the FX lab world on the demo canvas.
 *
 * @param kind - Ability kind to loop, a comma list, or 'all' to cycle.
 *
 * @example
 * startFxLab('nova');
 */
export function startFxLab(kind: string): void {
    const canvas = document.getElementById('overclock') as HTMLCanvasElement;
    const params = new URLSearchParams(location.search);
    const slow = Math.max(1, Number(params.get('slow')) || 1);
    const freezeRaw = params.get('freeze');
    const freeze = freezeRaw === null ? null : Math.max(0, Number(freezeRaw));
    const world = new World();
    installDefaults(world);
    const three = installThree(world, { canvas, clearColor: THEME.bgNum });
    setupRenderer(three);
    world.mount(FxLabNode, { kind, slow, freeze });
    world.start();
}
