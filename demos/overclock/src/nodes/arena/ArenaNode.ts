import * as THREE from 'three';
import { useFrameUpdate } from '@pulse-ts/core';
import { useObject3D } from '@pulse-ts/three';
import { THEME } from '../../config/theme';
import {
    BOARD_COLS,
    BOARD_ROWS,
    PLAYER_ROW_START,
    cellToWorld,
} from '../../sim/grid';

/** Hex circumradius in world units. */
export const HEX_R = 1;
/** Bench layout: z position and spacing of the 9 pads. */
export const BENCH_Z = (7 - 3.5) * 1.5 * HEX_R + 2.1;
export const BENCH_SPACING = 1.35;
export const BENCH_COUNT = 9;

/** World x for a bench slot index. */
export function benchSlotX(index: number): number {
    return (index - (BENCH_COUNT - 1) / 2) * BENCH_SPACING;
}

/** Imperative handle returned by {@link ArenaNode}. */
export interface ArenaHandle {
    /** Board tile meshes (userData: { row, col }). */
    tiles: THREE.Mesh[];
    /** Bench pad meshes (userData: { benchIndex }). */
    benchPads: THREE.Mesh[];
    /** Highlights one player cell (null clears). */
    setCellHighlight(cell: { row: number; col: number } | null): void;
    /** Highlights the bench rail during drags. */
    setBenchHighlight(on: boolean): void;
    /** Tints the arena rim (combat pulses). */
    setRimIntensity(intensity: number): void;
}

/**
 * Builds the floating arena: pedestal, rim, inlaid rings, animated energy
 * spokes, the 8x7 hex board and the 9-slot bench rail.
 *
 * Call inside a mounted node; returns an imperative handle used by the
 * interaction layer for picking and highlights.
 */
export function ArenaNode(): ArenaHandle {
    const g = new THREE.Group();
    useObject3D(g);

    const envCol = new THREE.Color(THEME.envNum);

    // ── Environment ────────────────────────────────────────────────────
    const floor = new THREE.Mesh(
        new THREE.CylinderGeometry(11, 11, 0.5, 80),
        new THREE.MeshStandardMaterial({
            color: envCol,
            metalness: 0.72,
            roughness: 0.5,
        }),
    );
    floor.position.y = -0.28;
    g.add(floor);

    const pedestal = new THREE.Mesh(
        new THREE.CylinderGeometry(10.2, 5.2, 3.6, 6),
        new THREE.MeshStandardMaterial({
            color: envCol.clone().multiplyScalar(0.5),
            metalness: 0.6,
            roughness: 0.6,
        }),
    );
    pedestal.position.y = -2.3;
    pedestal.rotation.y = Math.PI / 6;
    g.add(pedestal);

    const pedGlow = new THREE.Mesh(
        new THREE.CylinderGeometry(10.25, 10.25, 0.12, 6, 1, true),
        new THREE.MeshBasicMaterial({
            color: 0x39d0e6,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide,
        }),
    );
    pedGlow.position.y = -0.62;
    pedGlow.rotation.y = Math.PI / 6;
    g.add(pedGlow);

    const wall = new THREE.Mesh(
        new THREE.CylinderGeometry(11.02, 11.02, 0.9, 80, 1, true),
        new THREE.MeshStandardMaterial({
            color: envCol.clone().multiplyScalar(0.72),
            metalness: 0.8,
            roughness: 0.35,
            side: THREE.DoubleSide,
        }),
    );
    wall.position.y = 0.05;
    g.add(wall);

    const rimMat = new THREE.MeshStandardMaterial({
        color: THEME.allyNum,
        emissive: THEME.allyNum,
        emissiveIntensity: 1.0,
        metalness: 0.4,
        roughness: 0.4,
    });
    const rim = new THREE.Mesh(
        new THREE.TorusGeometry(11.02, 0.08, 12, 100),
        rimMat,
    );
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.5;
    g.add(rim);

    for (const [radius, opacity] of [
        [8.4, 0.24],
        [9.5, 0.18],
        [10.4, 0.12],
    ] as const) {
        const ring = new THREE.Mesh(
            new THREE.RingGeometry(radius - 0.03, radius + 0.03, 100),
            new THREE.MeshBasicMaterial({
                color: 0x39d0e6,
                transparent: true,
                opacity,
                side: THREE.DoubleSide,
            }),
        );
        ring.rotation.x = -Math.PI / 2;
        g.add(ring);
    }

    // Animated radial energy spokes in the outer margin.
    const spokes: THREE.Mesh[] = [];
    for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        const spoke = new THREE.Mesh(
            new THREE.BoxGeometry(2.0, 0.02, 0.05),
            new THREE.MeshBasicMaterial({
                color: 0x39d0e6,
                transparent: true,
                opacity: 0.16,
            }),
        );
        spoke.position.set(Math.cos(a) * 9.4, 0.01, Math.sin(a) * 9.4);
        spoke.rotation.y = -a;
        g.add(spoke);
        spokes.push(spoke);
    }

    // Ambient dust points.
    const dustGeo = new THREE.BufferGeometry();
    const dustCount = 220;
    const positions = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
        const r = 6 + Math.random() * 14;
        const a = Math.random() * Math.PI * 2;
        positions[i * 3] = Math.cos(a) * r;
        positions[i * 3 + 1] = 0.4 + Math.random() * 6;
        positions[i * 3 + 2] = Math.sin(a) * r;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const dust = new THREE.Points(
        dustGeo,
        new THREE.PointsMaterial({
            color: 0x9fdcec,
            size: 0.045,
            transparent: true,
            opacity: 0.5,
            depthWrite: false,
        }),
    );
    g.add(dust);

    // ── Board tiles ────────────────────────────────────────────────────
    const tiles: THREE.Mesh[] = [];
    const tileGeo = new THREE.CylinderGeometry(0.9, 0.9, 0.12, 6);
    const edgeGeo = new THREE.CylinderGeometry(0.97, 0.97, 0.05, 6);
    for (let row = 0; row < BOARD_ROWS; row++) {
        for (let col = 0; col < BOARD_COLS; col++) {
            const [x, z] = cellToWorld(row, col, HEX_R);
            const player = row >= PLAYER_ROW_START;
            const edge = new THREE.Mesh(
                edgeGeo,
                new THREE.MeshBasicMaterial({
                    color: player ? THEME.allyNum : THEME.enemyNum,
                    transparent: true,
                    opacity: player ? 0.16 : 0.1,
                }),
            );
            edge.position.set(x, 0.0, z);
            g.add(edge);

            const tile = new THREE.Mesh(
                tileGeo,
                new THREE.MeshStandardMaterial({
                    color: player ? THEME.tileAllyNum : THEME.tileEnemyNum,
                    metalness: 0.6,
                    roughness: 0.55,
                }),
            );
            tile.position.set(x, 0.06, z);
            tile.userData = { row, col };
            g.add(tile);
            tiles.push(tile);
        }
    }

    // ── Bench rail ─────────────────────────────────────────────────────
    const railW = BENCH_SPACING * BENCH_COUNT;
    const railMat = new THREE.MeshBasicMaterial({
        color: 0x39d0e6,
        transparent: true,
        opacity: 0.85,
    });
    const rail = new THREE.Mesh(
        new THREE.BoxGeometry(railW, 0.05, 0.06),
        railMat,
    );
    rail.position.set(0, 0.13, BENCH_Z + 0.75);
    g.add(rail);
    const backRail = new THREE.Mesh(
        new THREE.BoxGeometry(railW, 0.03, 0.05),
        new THREE.MeshBasicMaterial({
            color: 0x39d0e6,
            transparent: true,
            opacity: 0.3,
        }),
    );
    backRail.position.set(0, 0.13, BENCH_Z - 0.75);
    g.add(backRail);
    const spark = new THREE.Mesh(
        new THREE.BoxGeometry(0.7, 0.075, 0.1),
        new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.9,
        }),
    );
    spark.position.copy(rail.position);
    g.add(spark);

    const benchPads: THREE.Mesh[] = [];
    const padGeo = new THREE.CylinderGeometry(0.58, 0.62, 0.12, 6);
    for (let i = 0; i < BENCH_COUNT; i++) {
        const pad = new THREE.Mesh(
            padGeo,
            new THREE.MeshStandardMaterial({
                color: envCol.clone().multiplyScalar(0.85),
                metalness: 0.6,
                roughness: 0.5,
            }),
        );
        pad.position.set(benchSlotX(i), 0.06, BENCH_Z);
        pad.userData = { benchIndex: i };
        g.add(pad);
        benchPads.push(pad);
    }

    // ── Lights ─────────────────────────────────────────────────────────
    const hemi = new THREE.HemisphereLight(0xcfe6ff, 0x141c26, 0.95);
    g.add(hemi);
    const key = new THREE.DirectionalLight(0xbfe6ff, 1.7);
    key.position.set(6, 14, 8);
    g.add(key);
    const rimA = new THREE.PointLight(THEME.allyNum, 1.6, 34);
    rimA.position.set(0, 3, 8);
    g.add(rimA);
    const rimE = new THREE.PointLight(THEME.enemyNum, 1.6, 34);
    rimE.position.set(0, 3, -8);
    g.add(rimE);

    // ── Highlights & animation ─────────────────────────────────────────
    let highlighted: THREE.Mesh | null = null;
    const setCellHighlight = (cell: { row: number; col: number } | null) => {
        if (highlighted) {
            const mat = highlighted.material as THREE.MeshStandardMaterial;
            mat.emissive.setHex(0x000000);
            mat.emissiveIntensity = 1;
            highlighted = null;
        }
        if (cell) {
            const tile = tiles.find(
                (t) =>
                    t.userData.row === cell.row && t.userData.col === cell.col,
            );
            if (tile) {
                const mat = tile.material as THREE.MeshStandardMaterial;
                mat.emissive.setHex(THEME.accentNum);
                mat.emissiveIntensity = 0.55;
                highlighted = tile;
            }
        }
    };
    const setBenchHighlight = (on: boolean) => {
        railMat.opacity = on ? 1 : 0.85;
        railMat.color.setHex(on ? 0x7ff0ff : 0x39d0e6);
        for (const pad of benchPads) {
            const mat = pad.material as THREE.MeshStandardMaterial;
            mat.emissive.setHex(on ? THEME.accentNum : 0x000000);
            mat.emissiveIntensity = 0.25;
        }
    };

    let t = 0;
    useFrameUpdate((dt) => {
        t += dt;
        for (let i = 0; i < spokes.length; i++) {
            const mat = spokes[i].material as THREE.MeshBasicMaterial;
            mat.opacity = 0.08 + 0.16 * (0.5 + 0.5 * Math.sin(t * 2 - i * 0.6));
        }
        const phase = (t * 0.32) % 1;
        spark.position.x = -railW / 2 + phase * railW;
        dust.rotation.y += dt * 0.012;
        if (highlighted) {
            (
                highlighted.material as THREE.MeshStandardMaterial
            ).emissiveIntensity = 0.4 + 0.25 * Math.sin(t * 6);
        }
    });

    return {
        tiles,
        benchPads,
        setCellHighlight,
        setBenchHighlight,
        setRimIntensity: (intensity) => {
            rimMat.emissiveIntensity = intensity;
        },
    };
}
