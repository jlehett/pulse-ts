import * as THREE from 'three';
import { useContext, useFrameUpdate } from '@pulse-ts/core';
import { useAction, usePointer } from '@pulse-ts/input';
import { useThreeContext } from '@pulse-ts/three';
import { useSound } from '@pulse-ts/audio';
import { BattleCtx } from '../contexts';
import { allOwned, moveToBench, placeUnit, sellUnit } from '../run/runState';
import {
    PLAYER_ROW_START,
    BOARD_ROWS,
    BOARD_COLS,
    cellToWorld,
} from '../sim/grid';
import type { ArenaHandle } from './arena/ArenaNode';
import { BENCH_Z, HEX_R } from './arena/ArenaNode';
import type { UnitsHandle } from './units/UnitsNode';

/** Dependencies injected by the battle orchestrator. */
export interface InteractionDeps {
    arena: ArenaHandle;
    units: UnitsHandle;
}

/**
 * Mouse interaction layer for the prep phase: drag owned constructs
 * between bench and board, right-click to sell, hover highlights.
 */
export function InteractionNode(deps: InteractionDeps): void {
    const state = useContext(BattleCtx);
    const { camera, renderer } = useThreeContext();
    const pointer = usePointer();
    const select = useAction('select');
    const cancel = useAction('cancel');

    const placeSfx = useSound('tone', {
        wave: 'square',
        frequency: [340, 520],
        duration: 0.07,
        gain: 0.07,
        group: 'ui',
    });
    const sellSfx = useSound('tone', {
        wave: 'sawtooth',
        frequency: [500, 220],
        duration: 0.14,
        gain: 0.06,
        group: 'ui',
    });
    const pickSfx = useSound('tone', {
        wave: 'sine',
        frequency: [520, 640],
        duration: 0.05,
        gain: 0.05,
        group: 'ui',
    });

    const raycaster = new THREE.Raycaster();
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.12);
    const groundHit = new THREE.Vector3();

    const ndc = (): THREE.Vector2 | null => {
        const ptr = pointer();
        const el = renderer.domElement;
        const w = el.clientWidth;
        const h = el.clientHeight;
        if (!w || !h) return null;
        return new THREE.Vector2((ptr.x / w) * 2 - 1, -(ptr.y / h) * 2 + 1);
    };

    /** Owned-unit uid under the pointer, or null. */
    const pickOwnUnit = (): string | null => {
        const coords = ndc();
        if (!coords) return null;
        raycaster.setFromCamera(coords, camera);
        const hits = raycaster.intersectObjects(deps.units.groups(), true);
        const owned = new Set(allOwned(state.run).map((u) => u.uid));
        for (const hit of hits) {
            let obj: THREE.Object3D | null = hit.object;
            while (obj && !obj.userData.uid) obj = obj.parent;
            if (obj && owned.has(obj.userData.uid as string)) {
                return obj.userData.uid as string;
            }
        }
        return null;
    };

    /** Any unit uid under the pointer (for inspect tooltips). */
    const pickAnyUnit = (): string | null => {
        const coords = ndc();
        if (!coords) return null;
        raycaster.setFromCamera(coords, camera);
        const hits = raycaster.intersectObjects(deps.units.groups(), true);
        for (const hit of hits) {
            let obj: THREE.Object3D | null = hit.object;
            while (obj && !obj.userData.uid) obj = obj.parent;
            if (obj) return obj.userData.uid as string;
        }
        return null;
    };

    const groundPos = (): [number, number] | null => {
        const coords = ndc();
        if (!coords) return null;
        raycaster.setFromCamera(coords, camera);
        return raycaster.ray.intersectPlane(groundPlane, groundHit)
            ? [groundHit.x, groundHit.z]
            : null;
    };

    /** Player-half cell whose center is nearest the point (within a hex). */
    const cellAt = (
        x: number,
        z: number,
    ): { row: number; col: number } | null => {
        let best: { row: number; col: number } | null = null;
        let bestDist = HEX_R * HEX_R * 1.1;
        for (let row = PLAYER_ROW_START; row < BOARD_ROWS; row++) {
            for (let col = 0; col < BOARD_COLS; col++) {
                const [cx, cz] = cellToWorld(row, col, HEX_R);
                const d = (cx - x) * (cx - x) + (cz - z) * (cz - z);
                if (d < bestDist) {
                    bestDist = d;
                    best = { row, col };
                }
            }
        }
        return best;
    };

    useFrameUpdate(() => {
        if (state.phase !== 'prep') {
            if (state.dragUid) endDrag();
            state.hoverUid = null;
            return;
        }

        // Hover inspect (both teams).
        state.hoverUid = state.dragUid ?? pickAnyUnit();

        if (select().pressed && !state.dragUid) {
            const uid = pickOwnUnit();
            if (uid) {
                state.dragUid = uid;
                pickSfx.play();
            }
        }

        if (state.dragUid) {
            const pos = groundPos();
            if (pos) {
                state.dragWorld = pos;
                const nearBench = Math.abs(pos[1] - BENCH_Z) < 1.0;
                state.hoverBench = nearBench;
                state.hoverCell = nearBench ? null : cellAt(pos[0], pos[1]);
            }
            deps.arena.setCellHighlight(state.hoverCell);
            deps.arena.setBenchHighlight(state.hoverBench);

            if (select().released) {
                commitDrag();
            }
        }

        // Right-click sells the hovered owned construct.
        if (cancel().pressed && !state.dragUid) {
            const uid = pickOwnUnit();
            if (uid && sellUnit(state.run, uid)) {
                sellSfx.play();
                state.revision++;
            }
        }
    });

    const commitDrag = () => {
        const uid = state.dragUid!;
        if (state.hoverCell) {
            if (
                placeUnit(
                    state.run,
                    uid,
                    state.hoverCell.row,
                    state.hoverCell.col,
                )
            ) {
                placeSfx.play();
                state.revision++;
            }
        } else if (state.hoverBench) {
            if (moveToBench(state.run, uid)) {
                placeSfx.play();
                state.revision++;
            }
        }
        endDrag();
    };

    const endDrag = () => {
        state.dragUid = null;
        state.dragWorld = null;
        state.hoverCell = null;
        state.hoverBench = false;
        deps.arena.setCellHighlight(null);
        deps.arena.setBenchHighlight(false);
    };
}
