import * as THREE from 'three';
import { createTexture, createTexture1D } from '@pulse-ts/three';

/** Size (width and height) of generated grid textures in pixels. */
export const GRID_MAP_SIZE = 512;

/** Spacing between grid lines in pixels. */
export const GRID_SPACING = 64;

/** Width of emissive grid lines in pixels. */
export const GRID_LINE_WIDTH = 1;

/** Size of the energy line map in pixels. */
export const ENERGY_MAP_SIZE = 512;

/** Number of radial spokes in the energy line map. */
export const ENERGY_SPOKE_COUNT = 12;

/** Size of the ring glow texture in pixels. */
export const RING_GLOW_MAP_SIZE = 256;

/**
 * Generate a procedural grid normal map as a `DataTexture`.
 * Lines at regular intervals perturb the normal slightly,
 * giving the flat surface a subtle tiled look under lighting.
 *
 * @param size - Texture width and height in pixels.
 * @param spacing - Pixel spacing between grid lines.
 * @returns A `THREE.DataTexture` encoded as an RGBA normal map.
 *
 * @example
 * ```ts
 * const tex = createGridNormalMap(256, 32);
 * material.normalMap = tex;
 * ```
 */
export function createGridNormalMap(
    size: number = GRID_MAP_SIZE,
    spacing: number = GRID_SPACING,
): THREE.DataTexture {
    return createTexture(
        size,
        (x, y) => {
            let nx = 128;
            let ny = 128;
            if (x % spacing === 0) nx = 96;
            if (y % spacing === 0) ny = 96;
            return [nx, ny, 255, 255];
        },
        { wrap: 'repeat', filter: 'linear' },
    );
}

/**
 * Generate a grid emissive map — thin bright lines on a dark background.
 * Applied as the platform surface `emissiveMap` so the grid is
 * self-illuminated and visible from any camera angle.
 *
 * @param size - Texture width and height in pixels.
 * @param spacing - Pixel spacing between grid lines.
 * @param lineWidth - Width of each grid line in pixels.
 * @param radialFade - When true, lines fade from dark at center to bright at edge.
 * @returns A `THREE.DataTexture` with cyan grid lines on black.
 *
 * @example
 * ```ts
 * const tex = createGridEmissiveMap(256, 32, 2);
 * material.emissiveMap = tex;
 * ```
 */
export function createGridEmissiveMap(
    size: number = GRID_MAP_SIZE,
    spacing: number = GRID_SPACING,
    lineWidth: number = GRID_LINE_WIDTH,
    radialFade: boolean = false,
): THREE.DataTexture {
    const half = Math.floor(lineWidth / 2);
    const center = size / 2;

    return createTexture(
        size,
        (x, y) => {
            const onVertical =
                x % spacing <= half || x % spacing >= spacing - half;
            const onHorizontal =
                y % spacing <= half || y % spacing >= spacing - half;

            if (onVertical || onHorizontal) {
                let fade = 1;
                if (radialFade) {
                    const dx = (x - center) / center;
                    const dy = (y - center) / center;
                    fade = Math.min(1, Math.sqrt(dx * dx + dy * dy));
                }
                return [
                    Math.floor(50 * fade),
                    Math.floor(180 * fade),
                    Math.floor(220 * fade),
                    255,
                ];
            }
            return [0, 0, 0, 255];
        },
        { wrap: 'repeat', filter: 'linear' },
    );
}

/**
 * Generate a procedural radial-spoke energy line map as a `DataTexture`.
 * Used as an emissive map on a transparent overlay to create flowing
 * energy lines across the platform surface.
 *
 * @param size - Texture width and height in pixels.
 * @param spokeCount - Number of radial spokes.
 * @returns A `THREE.DataTexture` with cyan energy lines on black.
 *
 * @example
 * ```ts
 * const tex = createEnergyLineMap(256, 12);
 * material.emissiveMap = tex;
 * ```
 */
export function createEnergyLineMap(
    size: number = ENERGY_MAP_SIZE,
    spokeCount: number = ENERGY_SPOKE_COUNT,
): THREE.DataTexture {
    const center = size / 2;

    return createTexture(
        size,
        (px, py) => {
            const dx = px - center;
            const dy = py - center;
            const dist = Math.sqrt(dx * dx + dy * dy) / center;

            const angle = Math.atan2(dy, dx);
            const spokePhase = Math.abs(Math.sin(angle * spokeCount * 0.5));

            const spokeEdge = Math.max(0, (spokePhase - 0.9) / 0.1);
            const radialFade = Math.min(1, dist);
            const intensity = spokeEdge * spokeEdge * radialFade * 0.8;

            return [
                Math.floor(intensity * 128),
                Math.floor(intensity * 220),
                Math.floor(intensity * 255),
                255,
            ];
        },
        { wrap: 'repeat' },
    );
}

/**
 * Generate a 1D gradient texture for the ring glow that rotates around the torus.
 * The texture has a smooth bright region (~25% of the ring) that fades
 * to a dim base, creating a traveling highlight when UV-scrolled.
 *
 * @param size - Texture width in pixels (height is 1).
 * @returns A `THREE.DataTexture` with a smooth falloff gradient.
 *
 * @example
 * ```ts
 * const tex = createRingGlowMap(256);
 * ringMaterial.emissiveMap = tex;
 * ```
 */
export function createRingGlowMap(
    size: number = RING_GLOW_MAP_SIZE,
): THREE.DataTexture {
    return createTexture1D(
        size,
        (x, width) => {
            const t = x / width;
            const dist = Math.min(t, 1 - t) * 2;
            const glow = Math.pow(Math.max(0, 1 - dist * 3), 2);
            const base = 0.08;
            const intensity = base + (1 - base) * glow;
            const v = Math.floor(intensity * 255);
            return [v, v, v, 255];
        },
        { wrap: 'repeat', filter: 'linear' },
    );
}

/**
 * Create a blank single-channel wake influence map as a `DataTexture`.
 * The red channel stores wake intensity; the shader samples it to boost
 * emissive grid lines beneath and behind moving players.
 *
 * @param size - Texture width and height in pixels.
 * @returns A `THREE.DataTexture` initialized to zero with `LinearFilter`.
 *
 * @example
 * ```ts
 * const wake = createWakeMap(64);
 * material.userData.wakeMap = wake;
 * ```
 */
export function createWakeMap(size: number): THREE.DataTexture {
    return createTexture(size, () => [0, 0, 0, 0], { filter: 'linear' });
}
