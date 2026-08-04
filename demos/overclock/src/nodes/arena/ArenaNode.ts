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
import { AtmosphereNode } from './atmosphere';

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
    /** Marks which bench slots hold units (halo vs. empty holo ring). */
    setBenchOccupancy(occupied: boolean[]): void;
}

/**
 * Builds a flat slab with 45° chamfered corners — the bench deck silhouette
 * from the design (3D counterpart of the HUD's beveled panels).
 *
 * @param w - Width along x.
 * @param d - Depth along z.
 * @param h - Height along y.
 * @param cut - Corner chamfer size.
 * @param mat - Material for the slab.
 * @returns The slab mesh, centered at the origin.
 */
function chamferSlab(
    w: number,
    d: number,
    h: number,
    cut: number,
    mat: THREE.Material,
): THREE.Mesh {
    const hw = w / 2;
    const hd = d / 2;
    const shape = new THREE.Shape();
    shape.moveTo(-hw + cut, -hd);
    shape.lineTo(hw - cut, -hd);
    shape.lineTo(hw, -hd + cut);
    shape.lineTo(hw, hd - cut);
    shape.lineTo(hw - cut, hd);
    shape.lineTo(-hw + cut, hd);
    shape.lineTo(-hw, hd - cut);
    shape.lineTo(-hw, -hd + cut);
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, {
        depth: h,
        bevelEnabled: false,
    });
    geo.translate(0, 0, -h / 2);
    geo.rotateX(-Math.PI / 2);
    return new THREE.Mesh(geo, mat);
}

/**
 * Builds the floating arena: pedestal, rim, inlaid rings, animated energy
 * spokes, scan pulse, clash lights, the 8x7 hex board and the 9-slot bench
 * deck. Also mounts the deep-space atmosphere (nebula, stars, embers).
 *
 * Call inside a mounted node; returns an imperative handle used by the
 * interaction layer for picking and highlights.
 */
export function ArenaNode(): ArenaHandle {
    const g = new THREE.Group();
    useObject3D(g);
    AtmosphereNode();

    const envCol = new THREE.Color(THEME.envNum);

    // ── Environment ────────────────────────────────────────────────────
    // Lighter than the design's raw env color: modern three's physical
    // lights leave the dish interior near-black otherwise.
    const floor = new THREE.Mesh(
        new THREE.CylinderGeometry(11, 11, 0.5, 80),
        new THREE.MeshStandardMaterial({
            color: envCol.clone().multiplyScalar(1.9),
            metalness: 0.35,
            roughness: 0.6,
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
            color: THEME.edgeNum,
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
        color: THEME.accentNum,
        emissive: THEME.accentNum,
        emissiveIntensity: 2.0,
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

    // Inner accent ring marking the inset dish border.
    const rim2 = new THREE.Mesh(
        new THREE.TorusGeometry(9.5, 0.03, 8, 100),
        new THREE.MeshBasicMaterial({
            color: THEME.edgeNum,
            transparent: true,
            opacity: 0.35,
        }),
    );
    rim2.rotation.x = Math.PI / 2;
    rim2.position.y = 0;
    g.add(rim2);

    for (const [radius, opacity] of [
        [8.4, 0.24],
        [9.5, 0.18],
        [10.4, 0.12],
    ] as const) {
        const ring = new THREE.Mesh(
            new THREE.RingGeometry(radius - 0.03, radius + 0.03, 100),
            new THREE.MeshBasicMaterial({
                color: THEME.edgeNum,
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
                color: THEME.edgeNum,
                transparent: true,
                opacity: 0.16,
            }),
        );
        spoke.position.set(Math.cos(a) * 9.4, 0.01, Math.sin(a) * 9.4);
        spoke.rotation.y = -a;
        g.add(spoke);
        spokes.push(spoke);
    }

    // Expanding scan pulse sweeping outward from the board center.
    const pulseMat = new THREE.MeshBasicMaterial({
        color: THEME.edgeNum,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide,
    });
    const pulseRing = new THREE.Mesh(
        new THREE.RingGeometry(0.62, 0.86, 72),
        pulseMat,
    );
    pulseRing.rotation.x = -Math.PI / 2;
    pulseRing.position.y = 0.015;
    g.add(pulseRing);

    // ── Board tiles ────────────────────────────────────────────────────
    const tiles: THREE.Mesh[] = [];
    const tileGeo = new THREE.CylinderGeometry(
        HEX_R * 0.9,
        HEX_R * 0.9,
        0.22,
        6,
    );
    const insetGeo = new THREE.CylinderGeometry(
        HEX_R * 0.72,
        HEX_R * 0.72,
        0.06,
        6,
    );
    const tileEdgeGeo = new THREE.EdgesGeometry(tileGeo);
    for (let row = 0; row < BOARD_ROWS; row++) {
        for (let col = 0; col < BOARD_COLS; col++) {
            const [x, z] = cellToWorld(row, col, HEX_R);
            const player = row >= PLAYER_ROW_START;
            const baseColor = player ? THEME.tileAllyNum : THEME.tileEnemyNum;
            const baseGlow = player ? THEME.accentNum : THEME.enemyNum;

            const tile = new THREE.Mesh(
                tileGeo,
                new THREE.MeshStandardMaterial({
                    color: baseColor,
                    emissive: baseGlow,
                    emissiveIntensity: 0.1,
                    metalness: 0.45,
                    roughness: 0.5,
                    transparent: true,
                    opacity: 0.95,
                }),
            );
            tile.position.set(x, 0, z);
            tile.userData = { row, col };
            g.add(tile);
            tiles.push(tile);

            const inset = new THREE.Mesh(
                insetGeo,
                new THREE.MeshStandardMaterial({
                    color: new THREE.Color(baseColor).multiplyScalar(0.45),
                    metalness: 0.35,
                    roughness: 0.85,
                }),
            );
            inset.position.set(x, 0.12, z);
            g.add(inset);

            const edges = new THREE.LineSegments(
                tileEdgeGeo,
                new THREE.LineBasicMaterial({
                    color: THEME.edgeNum,
                    transparent: true,
                    opacity: 0.2,
                }),
            );
            edges.position.set(x, 0, z);
            g.add(edges);
        }
    }

    // ── Bench deck ─────────────────────────────────────────────────────
    const benchW = BENCH_SPACING * BENCH_COUNT;
    const deckW = benchW + 0.7;
    const railW = deckW - 0.66;

    const base = chamferSlab(
        benchW + 1.25,
        1.5,
        0.22,
        0.42,
        new THREE.MeshStandardMaterial({
            color: envCol.clone().multiplyScalar(0.5),
            metalness: 0.72,
            roughness: 0.5,
        }),
    );
    base.position.set(0, -0.08, BENCH_Z);
    g.add(base);
    const deck = chamferSlab(
        deckW,
        1.2,
        0.14,
        0.34,
        new THREE.MeshStandardMaterial({
            color: envCol.clone().multiplyScalar(0.88),
            metalness: 0.78,
            roughness: 0.4,
        }),
    );
    deck.position.set(0, 0.04, BENCH_Z);
    g.add(deck);

    const railMat = new THREE.MeshBasicMaterial({
        color: THEME.edgeNum,
        transparent: true,
        opacity: 0.85,
    });
    const rail = new THREE.Mesh(
        new THREE.BoxGeometry(railW, 0.05, 0.06),
        railMat,
    );
    rail.position.set(0, 0.13, BENCH_Z + 0.58);
    g.add(rail);
    const backRail = new THREE.Mesh(
        new THREE.BoxGeometry(railW, 0.03, 0.05),
        new THREE.MeshBasicMaterial({
            color: THEME.edgeNum,
            transparent: true,
            opacity: 0.3,
        }),
    );
    backRail.position.set(0, 0.13, BENCH_Z - 0.58);
    g.add(backRail);
    const spark = new THREE.Mesh(
        new THREE.BoxGeometry(0.7, 0.075, 0.1),
        new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.9,
        }),
    );
    spark.position.set(0, 0.14, BENCH_Z + 0.58);
    g.add(spark);

    const benchPads: THREE.Mesh[] = [];
    const benchHalos: THREE.Mesh[] = [];
    const benchHolos: THREE.Mesh[] = [];
    const benchRings: THREE.LineSegments[] = [];
    const padGeo = new THREE.CylinderGeometry(0.6, 0.64, 0.12, 6);
    const padEdgeGeo = new THREE.EdgesGeometry(
        new THREE.CylinderGeometry(0.6, 0.6, 0.12, 6),
    );
    const padInsetGeo = new THREE.CylinderGeometry(0.44, 0.44, 0.05, 6);
    for (let i = 0; i < BENCH_COUNT; i++) {
        const x = benchSlotX(i);
        const pad = new THREE.Mesh(
            padGeo,
            new THREE.MeshStandardMaterial({
                color: envCol.clone().multiplyScalar(0.7),
                emissive: THEME.edgeNum,
                emissiveIntensity: 0.06,
                metalness: 0.5,
                roughness: 0.5,
            }),
        );
        pad.rotation.y = Math.PI / 6;
        pad.position.set(x, 0.14, BENCH_Z);
        pad.userData = { benchIndex: i };
        g.add(pad);
        benchPads.push(pad);

        const inset = new THREE.Mesh(
            padInsetGeo,
            new THREE.MeshStandardMaterial({
                color: envCol.clone().multiplyScalar(0.32),
                metalness: 0.4,
                roughness: 0.85,
            }),
        );
        inset.rotation.y = Math.PI / 6;
        inset.position.set(x, 0.2, BENCH_Z);
        g.add(inset);

        const ring = new THREE.LineSegments(
            padEdgeGeo,
            new THREE.LineBasicMaterial({
                color: THEME.edgeNum,
                transparent: true,
                opacity: 0.22,
            }),
        );
        ring.rotation.y = Math.PI / 6;
        ring.position.set(x, 0.14, BENCH_Z);
        g.add(ring);
        benchRings.push(ring);

        const halo = new THREE.Mesh(
            new THREE.RingGeometry(0.48, 0.62, 6),
            new THREE.MeshBasicMaterial({
                color: THEME.allyNum,
                transparent: true,
                opacity: 0.42,
                side: THREE.DoubleSide,
            }),
        );
        halo.rotation.x = -Math.PI / 2;
        halo.rotation.z = Math.PI / 3;
        halo.position.set(x, 0.22, BENCH_Z);
        halo.visible = false;
        g.add(halo);
        benchHalos.push(halo);

        const holo = new THREE.Mesh(
            new THREE.RingGeometry(0.32, 0.4, 6),
            new THREE.MeshBasicMaterial({
                color: THEME.edgeNum,
                transparent: true,
                opacity: 0.32,
                side: THREE.DoubleSide,
            }),
        );
        holo.rotation.x = -Math.PI / 2;
        holo.rotation.z = Math.PI / 3;
        holo.position.set(x, 0.23, BENCH_Z);
        g.add(holo);
        benchHolos.push(holo);
    }

    // ── Lights ─────────────────────────────────────────────────────────
    const hemi = new THREE.HemisphereLight(0xcfe6ff, 0x12181f, 0.85);
    g.add(hemi);
    const key = new THREE.DirectionalLight(0xbfe6ff, 1.6);
    key.position.set(6, 14, 8);
    g.add(key);
    // Camera-side fill: lifts the faces units show the player. Imported GLB
    // models have no environment map to catch, so without this they read
    // much darker than the emissive-lit procedural robots.
    const fill = new THREE.DirectionalLight(0xe4f1ff, 1.3);
    fill.position.set(0, 8, 17);
    g.add(fill);
    const rimA = new THREE.PointLight(THEME.allyNum, 1.3, 34);
    rimA.position.set(0, 3, 8);
    g.add(rimA);
    const rimE = new THREE.PointLight(THEME.enemyNum, 1.3, 34);
    rimE.position.set(0, 3, -8);
    g.add(rimE);
    // Flickering clash lights over the front line.
    const clashA = new THREE.PointLight(THEME.allyNum, 1.4, 9);
    clashA.position.set(-2, 1.1, 0.6);
    g.add(clashA);
    const clashE = new THREE.PointLight(THEME.enemyNum, 1.4, 9);
    clashE.position.set(2.4, 1.1, -0.4);
    g.add(clashE);

    // ── Highlights & animation ─────────────────────────────────────────
    let highlighted: THREE.Mesh | null = null;
    const restoreTile = (tile: THREE.Mesh) => {
        const mat = tile.material as THREE.MeshStandardMaterial;
        const player = (tile.userData.row as number) >= PLAYER_ROW_START;
        mat.emissive.setHex(player ? THEME.accentNum : THEME.enemyNum);
        mat.emissiveIntensity = 0.1;
    };
    const setCellHighlight = (cell: { row: number; col: number } | null) => {
        if (highlighted) {
            restoreTile(highlighted);
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
        railMat.color.setHex(on ? 0x7ff0ff : THEME.edgeNum);
        for (const pad of benchPads) {
            const mat = pad.material as THREE.MeshStandardMaterial;
            mat.emissive.setHex(on ? THEME.accentNum : THEME.edgeNum);
            mat.emissiveIntensity = on ? 0.25 : 0.06;
        }
    };
    const setBenchOccupancy = (occupied: boolean[]) => {
        for (let i = 0; i < BENCH_COUNT; i++) {
            const has = occupied[i] === true;
            benchHalos[i].visible = has;
            benchHolos[i].visible = !has;
            (
                benchPads[i].material as THREE.MeshStandardMaterial
            ).emissiveIntensity = has ? 0.16 : 0.06;
            (benchRings[i].material as THREE.LineBasicMaterial).opacity = has
                ? 0.55
                : 0.22;
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
        const scan = (t * 0.26) % 1;
        // Cap the sweep at the inset border ring (r 9.5; outer edge 0.86 * s).
        const scanScale = 0.85 + scan * 10.2;
        pulseRing.scale.set(scanScale, scanScale, 1);
        pulseMat.opacity = 0.38 * (1 - scan);
        clashA.intensity = 1.2 + Math.abs(Math.sin(t * 5)) * 1.3;
        clashE.intensity = 1.2 + Math.abs(Math.sin(t * 5 + 1.5)) * 1.3;
        const holoOpacity = 0.18 + 0.2 * (0.5 + 0.5 * Math.sin(t * 2.6));
        for (const holo of benchHolos) {
            (holo.material as THREE.MeshBasicMaterial).opacity = holoOpacity;
        }
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
        setBenchOccupancy,
        setRimIntensity: (intensity) => {
            rimMat.emissiveIntensity = intensity;
        },
    };
}
