import { useComponent, Transform, useFrameUpdate } from '@pulse-ts/core';
import { useRigidBody, useCylinderCollider } from '@pulse-ts/physics';
import { useMesh, useObject3D, useThreeContext } from '@pulse-ts/three';
import { useAnimate } from '@pulse-ts/effects';
import * as THREE from 'three';
import { ARENA_RADIUS } from '../config/arena';
import { isMobileDevice } from '../isMobileDevice';
import {
    updateHitImpacts,
    getActiveHitImpacts,
    HIT_RIPPLE_DISPLACEMENT,
    HIT_RIPPLE_MAX_RADIUS,
    HIT_RIPPLE_EXPAND_DURATION,
    HIT_RIPPLE_RING_WIDTH,
} from '../hitImpact';

/** Radius of the arena cylinder (sourced from arena config). */
export const PLATFORM_RADIUS = ARENA_RADIUS;

/** Height (thickness) of the arena cylinder. */
export const PLATFORM_HEIGHT = 0.5;

/** Color of the platform surface — dark space-purple with a cyan-blue tint. */
const PLATFORM_COLOR = 0x0a0c1a;

/** Color of the emissive edge ring. */
const RING_COLOR = 0x00ccff;

/** Size (width and height) of generated grid textures in pixels. */
const GRID_MAP_SIZE = 512;

/** Spacing between grid lines in pixels. */
const GRID_SPACING = 64;

/** Width of emissive grid lines in pixels. */
const GRID_LINE_WIDTH = 1;

/** Size of the energy line map in pixels. */
const ENERGY_MAP_SIZE = 512;

/** Number of radial spokes in the energy line map. */
const ENERGY_SPOKE_COUNT = 12;

/** Size of the ring glow texture in pixels. */
const RING_GLOW_MAP_SIZE = 256;

/** Clockwise rotation speed of the ring glow (revolutions per second). */
const RING_GLOW_SPEED = 0.15;

/** Number of ripple ring meshes in the pool. */
const RIPPLE_COUNT = 3;

/** Seconds between ripple spawns. */
export const RIPPLE_INTERVAL = 4;

/** How long each ripple takes to expand from center to edge (seconds). */
export const RIPPLE_DURATION = 2.5;

/** Peak emissive boost multiplier for the ripple (applied on top of base). */
export const RIPPLE_INTENSITY = 5;

/** Resolution of the CPU-rasterized wake influence map (desktop). */
export const WAKE_MAP_SIZE = 64;

/** Resolution of the wake influence map on mobile (reduced for CPU savings). */
export const WAKE_MAP_SIZE_MOBILE = 32;

/** Maximum UV displacement applied by the wake effect (UV units). */
export const WAKE_DISPLACEMENT = 0.06;

/** Minimum world-space distance between trail samples to register a wake point. */
export const WAKE_MIN_DISTANCE = 0.05;

/** World-space radius of each wake splat at full expansion (units). */
export const WAKE_RADIUS = 4;

/** Fraction of WAKE_RADIUS used for fresh trail points (0..1). Grows to 1.0 as strength decays. */
export const WAKE_THIN_START = 0.25;

/** Seconds between trail point samples for the wake effect. */
export const WAKE_TRAIL_INTERVAL = 0.05;

/** Strength decay rate per second for trail points. */
export const WAKE_TRAIL_DECAY = 1.2;

/** Maximum number of trail points stored for the wake effect. */
export const WAKE_MAX_TRAIL = 80;

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
    const data = new Uint8Array(size * size * 4);
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const i = (y * size + x) * 4;
            // Default flat normal: (0.5, 0.5, 1.0) in [0,1] -> (0, 0, 1) in [-1,1]
            let nx = 128;
            let ny = 128;
            const nz = 255;

            // Perturb normals at grid-line boundaries
            if (x % spacing === 0) nx = 96; // tilt left at vertical lines
            if (y % spacing === 0) ny = 96; // tilt down at horizontal lines

            data[i] = nx;
            data[i + 1] = ny;
            data[i + 2] = nz;
            data[i + 3] = 255;
        }
    }
    const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.magFilter = THREE.LinearFilter;
    tex.minFilter = THREE.LinearFilter;
    tex.needsUpdate = true;
    return tex;
}

/**
 * Generate a grid emissive map — thin bright lines on a dark background.
 * Applied as the platform surface `emissiveMap` so the grid is
 * self-illuminated and visible from any camera angle.
 *
 * @param size - Texture width and height in pixels.
 * @param spacing - Pixel spacing between grid lines.
 * @param lineWidth - Width of each grid line in pixels.
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
    const data = new Uint8Array(size * size * 4);
    const half = Math.floor(lineWidth / 2);
    const center = size / 2;

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const i = (y * size + x) * 4;
            const onVertical =
                x % spacing <= half || x % spacing >= spacing - half;
            const onHorizontal =
                y % spacing <= half || y % spacing >= spacing - half;

            if (onVertical || onHorizontal) {
                // Radial fade: 0 at center, 1 at edge
                let fade = 1;
                if (radialFade) {
                    const dx = (x - center) / center;
                    const dy = (y - center) / center;
                    fade = Math.min(1, Math.sqrt(dx * dx + dy * dy));
                }
                // Cyan grid line scaled by radial fade
                data[i] = Math.floor(50 * fade);
                data[i + 1] = Math.floor(180 * fade);
                data[i + 2] = Math.floor(220 * fade);
            }
            // else: black (already 0)

            data[i + 3] = 255;
        }
    }

    const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.magFilter = THREE.LinearFilter;
    tex.minFilter = THREE.LinearFilter;
    tex.needsUpdate = true;
    return tex;
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
    const data = new Uint8Array(size * size * 4);
    const center = size / 2;

    for (let py = 0; py < size; py++) {
        for (let px = 0; px < size; px++) {
            const i = (py * size + px) * 4;
            const dx = px - center;
            const dy = py - center;
            const dist = Math.sqrt(dx * dx + dy * dy) / center;

            // Radial spoke pattern with smooth falloff
            const angle = Math.atan2(dy, dx);
            const spokePhase = Math.abs(Math.sin(angle * spokeCount * 0.5));

            // Smooth ramp: fade from 0 at phase 0.9 to full at phase 1.0
            const spokeEdge = Math.max(0, (spokePhase - 0.9) / 0.1);
            // Dark at center, bright at edge (matching grid radial fade)
            const radialFade = Math.min(1, dist);
            const intensity = spokeEdge * spokeEdge * radialFade * 0.8;

            // Cyan tint (R slightly less than G and B)
            data[i] = Math.floor(intensity * 128);
            data[i + 1] = Math.floor(intensity * 220);
            data[i + 2] = Math.floor(intensity * 255);
            data[i + 3] = 255;
        }
    }

    const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.needsUpdate = true;
    return tex;
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
    const data = new Uint8Array(size * 4);
    for (let x = 0; x < size; x++) {
        const t = x / size; // 0..1 around the ring
        // Smooth bright region centered at t=0 spanning ~25% of the ring
        // Use a cosine falloff for a natural glow shape
        const dist = Math.min(t, 1 - t) * 2; // 0 at center, 1 at opposite side
        const glow = Math.pow(Math.max(0, 1 - dist * 3), 2); // smooth falloff
        const base = 0.08; // dim base so the ring is never fully dark
        const intensity = base + (1 - base) * glow;

        const i = x * 4;
        data[i] = Math.floor(intensity * 255);
        data[i + 1] = Math.floor(intensity * 255);
        data[i + 2] = Math.floor(intensity * 255);
        data[i + 3] = 255;
    }
    const tex = new THREE.DataTexture(data, size, 1, THREE.RGBAFormat);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.magFilter = THREE.LinearFilter;
    tex.minFilter = THREE.LinearFilter;
    tex.needsUpdate = true;
    return tex;
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
export function createWakeMap(size: number = WAKE_MAP_SIZE): THREE.DataTexture {
    const data = new Uint8Array(size * size * 4);
    const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    tex.magFilter = THREE.LinearFilter;
    tex.minFilter = THREE.LinearFilter;
    tex.needsUpdate = true;
    return tex;
}

/**
 * Trail point used by the wake rasterizer.
 */
export interface WakeTrailPoint {
    /** World-space X position. */
    x: number;
    /** World-space Z position. */
    z: number;
    /** Intensity in 0..1 (1 = fresh, decays toward 0). */
    strength: number;
    /** Normalized movement direction X (world space). */
    dirX: number;
    /** Normalized movement direction Z (world space). */
    dirZ: number;
}

/**
 * Rasterize wake trail displacement into an RGBA `Uint8Array`.
 * Each trail point splats a 2D displacement vector perpendicular to the
 * player's movement direction, creating a boat-wake distortion that pushes
 * grid lines outward from the trail path.
 *
 * Encoding: R = 128 + du*127, G = 128 + dv*127, B = 0, A = 255.
 * 128 = no displacement; signed direction encoded around midpoint.
 *
 * @param data - RGBA pixel buffer (`size * size * 4` bytes). Cleared then filled.
 * @param size - Width and height of the texture in pixels.
 * @param trail - Array of trail points with world-space positions, strength, and direction.
 * @param arenaRadius - World-space radius of the arena (maps to texture extent).
 * @param wakeRadius - World-space radius of each wake splat.
 *
 * @example
 * ```ts
 * rasterizeWake(wakeMap.image.data, 64, trail, ARENA_RADIUS, WAKE_RADIUS);
 * wakeMap.needsUpdate = true;
 * ```
 */
export function rasterizeWake(
    data: Uint8Array,
    size: number,
    trail: readonly WakeTrailPoint[],
    arenaRadius: number,
    wakeRadius: number,
): void {
    const texelCount = size * size;

    // Initialize output: R=128, G=128, B=0, A=255 (no displacement)
    for (let i = 0; i < texelCount; i++) {
        const idx = i * 4;
        data[idx] = 128;
        data[idx + 1] = 128;
        data[idx + 2] = 0;
        data[idx + 3] = 255;
    }

    if (trail.length === 0) return;

    // Float32 scratch buffer for clean accumulation (2 floats per texel: du, dv)
    const scratch = new Float32Array(texelCount * 2);

    // Precompute base pixel radius
    const texelsPerUnit = size / (arenaRadius * 2);
    const maxSplatRadius = wakeRadius * texelsPerUnit;

    for (const pt of trail) {
        // Wake starts thin (WAKE_THIN_START fraction) and expands as
        // strength decays toward 0, reaching full radius at end of life.
        const widthFraction =
            WAKE_THIN_START + (1 - WAKE_THIN_START) * (1 - pt.strength);
        const splatRadius = maxSplatRadius * widthFraction;
        const splatRadiusSq = splatRadius * splatRadius;

        // World to texel: center of arena = (size/2, size/2).
        // Three.js CylinderGeometry cap UVs: u = (z/R+1)*0.5, v = (x/R+1)*0.5
        // so texel column (cx) maps from world Z, texel row (cy) from world X.
        const cx = (pt.z / arenaRadius + 1) * 0.5 * size;
        const cy = (pt.x / arenaRadius + 1) * 0.5 * size;

        // Movement direction mapped to texel space:
        // texel X proportional to world Z, texel Y proportional to world X
        const movTexX = pt.dirZ;
        const movTexY = pt.dirX;

        // Perpendicular to movement in texel space
        const perpTexX = -movTexY;
        const perpTexY = movTexX;

        const minX = Math.max(0, Math.floor(cx - splatRadius));
        const maxX = Math.min(size - 1, Math.ceil(cx + splatRadius));
        const minY = Math.max(0, Math.floor(cy - splatRadius));
        const maxY = Math.min(size - 1, Math.ceil(cy + splatRadius));

        for (let py = minY; py <= maxY; py++) {
            for (let px = minX; px <= maxX; px++) {
                const dx = px - cx;
                const dy = py - cy;
                const distSq = dx * dx + dy * dy;
                if (distSq >= splatRadiusSq) continue;

                const dist = Math.sqrt(distSq);
                if (dist < 0.001) continue;

                // Smoothstep radial falloff: 1 at center, 0 at edge
                const t = dist / splatRadius;
                const radialFalloff = 1 - t * t * (3 - 2 * t);

                // Signed perpendicular distance from the trail line.
                // Positive = one side, negative = other side.
                // Normalized by splatRadius so the factor stays in [-1, 1].
                const perpDot = dx * perpTexX + dy * perpTexY;
                const perpFactor = perpDot / splatRadius;

                // Displacement is perpendicular to movement, scaled by
                // how far off the trail line this texel is (perpFactor)
                // and the radial falloff. Zero ON the trail line, peaks
                // to the sides, then falls off at the splat edge.
                const mag = perpFactor * radialFalloff * pt.strength;
                const si = (py * size + px) * 2;
                scratch[si] += perpTexX * mag;
                scratch[si + 1] += perpTexY * mag;
            }
        }
    }

    // Encode accumulated displacement to RGBA uint8
    for (let i = 0; i < texelCount; i++) {
        const si = i * 2;
        const du = scratch[si];
        const dv = scratch[si + 1];
        const idx = i * 4;
        data[idx] = Math.min(255, Math.max(0, Math.round(128 + du * 127)));
        data[idx + 1] = Math.min(255, Math.max(0, Math.round(128 + dv * 127)));
    }
}

/**
 * Convert a world-space XZ position to UV coordinates matching
 * Three.js CylinderGeometry's top-cap UV layout.
 *
 * UV mapping: `u = (z / R + 1) * 0.5`, `v = (x / R + 1) * 0.5`.
 *
 * @param worldX - World-space X coordinate.
 * @param worldZ - World-space Z coordinate.
 * @param arenaRadius - Radius of the arena cylinder.
 * @returns `[u, v]` in 0–1 UV space.
 *
 * @example
 * ```ts
 * worldToUV(0, 0, 10); // [0.5, 0.5] — center
 * worldToUV(10, 0, 10); // [0.5, 1.0] — edge
 * ```
 */
export function worldToUV(
    worldX: number,
    worldZ: number,
    arenaRadius: number,
): [number, number] {
    const u = (worldZ / arenaRadius + 1) * 0.5;
    const v = (worldX / arenaRadius + 1) * 0.5;
    return [u, v];
}

/**
 * Circular arena platform — a flat cylinder with a glowing grid surface,
 * flowing energy lines, and a pulsing emissive edge ring with outer glow.
 *
 * Uses a cylinder collider for accurate circular collision
 * (no edge walls so players can be knocked off).
 */
export function PlatformNode() {
    const transform = useComponent(Transform);
    transform.localPosition.set(0, 0, 0);

    // Physics — static cylinder collider matching the visual cylinder
    useRigidBody({ type: 'static' });
    useCylinderCollider(PLATFORM_RADIUS, PLATFORM_HEIGHT / 2, {
        friction: 0.6,
        restitution: 0,
    });

    // Visual — cylinder mesh for the platform surface (opaque dark base)
    const { material: platformMat } = useMesh('cylinder', {
        radius: PLATFORM_RADIUS,
        height: PLATFORM_HEIGHT,
        radialSegments: 48,
        color: PLATFORM_COLOR,
        roughness: 0.7,
        metalness: 0.2,
        receiveShadow: true,
    });

    // --- Blue tint fill on top of the grid ---
    const fillGeometry = new THREE.CylinderGeometry(
        PLATFORM_RADIUS,
        PLATFORM_RADIUS,
        0.01,
        48,
    );
    const fillMaterial = new THREE.MeshBasicMaterial({
        color: 0x2244aa,
        transparent: true,
        opacity: 0.035,
        depthWrite: false,
    });
    const fillMesh = new THREE.Mesh(fillGeometry, fillMaterial);
    fillMesh.position.y = PLATFORM_HEIGHT / 2 + 0.01;
    useObject3D(fillMesh);

    // Procedural grid normal map — subtle surface relief at grid lines
    const normalMap = createGridNormalMap();
    platformMat.normalMap = normalMap;
    platformMat.normalScale = new THREE.Vector2(0.3, 0.3);

    // Grid emissive map — visible glowing grid lines on the surface
    // Radial fade: lines are dark at center, bright at edge.
    // No repeat — single pass covers entire surface with baked falloff.
    const gridEmissiveMap = createGridEmissiveMap(
        GRID_MAP_SIZE,
        GRID_SPACING / 2,
        GRID_LINE_WIDTH,
        true,
    );
    platformMat.emissive = new THREE.Color(RING_COLOR);
    platformMat.emissiveMap = gridEmissiveMap;
    platformMat.emissiveIntensity = 0.15;

    // --- Energy line overlay ---
    const energyMap = createEnergyLineMap();
    const energyGeometry = new THREE.CylinderGeometry(
        PLATFORM_RADIUS - 0.1,
        PLATFORM_RADIUS - 0.1,
        0.02,
        48,
    );
    const energyMaterial = new THREE.MeshStandardMaterial({
        color: 0x000000,
        emissive: RING_COLOR,
        emissiveMap: energyMap,
        emissiveIntensity: 0.12,
        transparent: true,
        opacity: 0.15,
        roughness: 1,
        metalness: 0,
        depthWrite: false,
    });
    const energyMesh = new THREE.Mesh(energyGeometry, energyMaterial);
    energyMesh.position.y = PLATFORM_HEIGHT / 2 + 0.02;
    useObject3D(energyMesh);

    // --- Enhanced edge ring (primary) with rotating glow ---
    const ringGlowMap = createRingGlowMap();
    const ringGeometry = new THREE.TorusGeometry(PLATFORM_RADIUS, 0.12, 12, 64);
    const ringMaterial = new THREE.MeshStandardMaterial({
        color: 0x000000,
        emissive: RING_COLOR,
        emissiveMap: ringGlowMap,
        emissiveIntensity: 1.5,
        roughness: 0.3,
        metalness: 0.5,
    });
    const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.y = PLATFORM_HEIGHT / 2;
    useObject3D(ringMesh);

    // --- Outer glow ring (soft halo) with same rotating glow ---
    const glowGlowMap = createRingGlowMap();
    const glowGeometry = new THREE.TorusGeometry(PLATFORM_RADIUS, 0.3, 12, 64);
    const glowMaterial = new THREE.MeshStandardMaterial({
        color: 0x000000,
        emissive: RING_COLOR,
        emissiveMap: glowGlowMap,
        emissiveIntensity: 0.6,
        transparent: true,
        opacity: 0.15,
        roughness: 0.5,
        metalness: 0.3,
        depthWrite: false,
    });
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    glowMesh.rotation.x = -Math.PI / 2;
    glowMesh.position.y = PLATFORM_HEIGHT / 2;
    useObject3D(glowMesh);

    // --- Wake map (CPU-rasterized player trail influence) ---
    const mobile = isMobileDevice();
    const wakeSize = mobile ? WAKE_MAP_SIZE_MOBILE : WAKE_MAP_SIZE;
    const wakeMap = createWakeMap(wakeSize);
    const wakeTrail: WakeTrailPoint[] = [];
    let wakeTrailTimer = 0;
    const lastPlayerPositions: Array<{ x: number; z: number }> = [];
    let wakeFrameSkip = 0;

    // --- Ripple + wake shader patch (radial emissive boost on grid lines) ---
    // Patches the platform fragment shader to add ripple and wake multipliers.
    // Up to RIPPLE_COUNT concurrent ripples tracked via a vec4 uniform
    // where each component is a normalized radius (0=center, 1=edge, -1=inactive).
    // The wake map samples a DataTexture to boost grid lines beneath/behind players.
    const rippleRadii = new THREE.Vector4(-1, -1, -1, -1);
    const rippleUniforms = {
        uRippleRadii: { value: rippleRadii },
        uRippleBoost: { value: RIPPLE_INTENSITY },
    };
    const wakeUniforms = {
        uWakeMap: { value: wakeMap },
        uWakeDisplacement: { value: WAKE_DISPLACEMENT },
    };

    // Hit ripple uniforms — expanding displacement rings from hit positions
    const hitRippleRadii = new THREE.Vector4(-1, -1, -1, -1);
    const hitRippleCenterX = new THREE.Vector4(0, 0, 0, 0);
    const hitRippleCenterY = new THREE.Vector4(0, 0, 0, 0);
    const hitRippleUniforms = {
        uHitRippleRadii: { value: hitRippleRadii },
        uHitRippleCenterX: { value: hitRippleCenterX },
        uHitRippleCenterY: { value: hitRippleCenterY },
        uHitRippleDisp: { value: HIT_RIPPLE_DISPLACEMENT },
        uHitRippleWidth: { value: HIT_RIPPLE_RING_WIDTH },
    };

    platformMat.onBeforeCompile = (shader) => {
        shader.uniforms.uRippleRadii = rippleUniforms.uRippleRadii;
        shader.uniforms.uRippleBoost = rippleUniforms.uRippleBoost;
        shader.uniforms.uWakeMap = wakeUniforms.uWakeMap;
        shader.uniforms.uWakeDisplacement = wakeUniforms.uWakeDisplacement;
        shader.uniforms.uHitRippleRadii = hitRippleUniforms.uHitRippleRadii;
        shader.uniforms.uHitRippleCenterX = hitRippleUniforms.uHitRippleCenterX;
        shader.uniforms.uHitRippleCenterY = hitRippleUniforms.uHitRippleCenterY;
        shader.uniforms.uHitRippleDisp = hitRippleUniforms.uHitRippleDisp;
        shader.uniforms.uHitRippleWidth = hitRippleUniforms.uHitRippleWidth;

        shader.fragmentShader = shader.fragmentShader.replace(
            '#include <common>',
            `#include <common>
            uniform vec4 uRippleRadii;
            uniform float uRippleBoost;
            uniform sampler2D uWakeMap;
            uniform float uWakeDisplacement;
            uniform vec4 uHitRippleRadii;
            uniform vec4 uHitRippleCenterX;
            uniform vec4 uHitRippleCenterY;
            uniform float uHitRippleDisp;
            uniform float uHitRippleWidth;`,
        );

        // Replace the emissivemap_fragment entirely: sample wake displacement,
        // offset emissive UVs, then sample the emissive map at displaced coords.
        shader.fragmentShader = shader.fragmentShader.replace(
            '#include <emissivemap_fragment>',
            `{
                // Decode wake displacement from RG channels (128 = zero)
                vec4 wakeSample = texture2D(uWakeMap, vEmissiveMapUv);
                vec2 wakeDisp = (wakeSample.rg - 0.5) * 2.0;
                vec2 displacedUv = vEmissiveMapUv + wakeDisp * uWakeDisplacement;

                // Hit ripple displacement — expanding rings from hit positions
                for (int i = 0; i < 4; i++) {
                    float hr = uHitRippleRadii[i];
                    if (hr < 0.0) continue;
                    vec2 hitCenter = vec2(uHitRippleCenterX[i], uHitRippleCenterY[i]);
                    vec2 toFrag = displacedUv - hitCenter;
                    float fragDist = length(toFrag);
                    float band = abs(fragDist - hr);
                    if (band < uHitRippleWidth && fragDist > 0.001) {
                        float ringFalloff = 1.0 - band / uHitRippleWidth;
                        // Age fade: hr / maxRadius gives progress; fade out as it expands
                        float ageFade = 1.0 - smoothstep(0.0, 1.0, hr / ${HIT_RIPPLE_MAX_RADIUS.toFixed(1)});
                        vec2 dir = toFrag / fragDist;
                        displacedUv += dir * ringFalloff * ageFade * uHitRippleDisp;
                    }
                }

                // Sample emissive map at displaced UVs (replaces standard include)
                vec4 emissiveColor = texture2D(emissiveMap, displacedUv);
                totalEmissiveRadiance *= emissiveColor.rgb;

                // Ripple boost on top of displaced grid
                float uvDist = length(vEmissiveMapUv - vec2(0.5)) * 2.0;
                float rippleBoost = 0.0;
                for (int i = 0; i < 4; i++) {
                    float rr = uRippleRadii[i];
                    if (rr >= 0.0) {
                        float bandWidth = min(0.45, rr);
                        float d = abs(uvDist - rr);
                        rippleBoost += smoothstep(bandWidth, 0.0, d);
                    }
                }
                totalEmissiveRadiance *= (1.0 + rippleBoost * uRippleBoost);
            }`,
        );
    };

    const rippleAges: number[] = new Array(RIPPLE_COUNT).fill(-1);
    let rippleTimer = 0;
    let nextRipple = 0;

    // Scene access for finding player positions
    const { scene } = useThreeContext();

    // Animation — pulsing glow on the ring
    const pulse = useAnimate({
        wave: 'sine',
        min: 0.4,
        max: 1.5,
        frequency: 1.5,
    });

    // Animation — energy line rotation
    const energySpin = useAnimate({ rate: 0.3 });

    // Animation — clockwise ring glow rotation
    const ringGlowSpin = useAnimate({ rate: RING_GLOW_SPEED });

    useFrameUpdate((dt) => {
        // Advance hit impact ages (must run before AtmosphericDustNode reads them)
        updateHitImpacts(dt);

        // Sync hit ripple uniforms from active slots
        const hitSlots = getActiveHitImpacts();
        for (let i = 0; i < 4; i++) {
            const slot = hitSlots[i];
            if (slot.active) {
                const [u, v] = worldToUV(
                    slot.worldX,
                    slot.worldZ,
                    ARENA_RADIUS,
                );
                hitRippleCenterX.setComponent(i, u);
                hitRippleCenterY.setComponent(i, v);
                // Expanding radius: age / expand_duration, clamped to max
                const progress = Math.min(
                    slot.age / HIT_RIPPLE_EXPAND_DURATION,
                    1,
                );
                hitRippleRadii.setComponent(
                    i,
                    progress * HIT_RIPPLE_MAX_RADIUS,
                );
            } else {
                hitRippleRadii.setComponent(i, -1);
            }
        }

        ringMaterial.emissiveIntensity = pulse.value;
        glowMaterial.emissiveIntensity = pulse.value * 0.4;

        // Rotate energy line overlay around Y axis
        energyMesh.rotation.y = energySpin.value;

        // Rotate ring glow clockwise by scrolling emissiveMap UV offset
        // Negative offset = clockwise when torus is viewed from above
        const glowOffset = -ringGlowSpin.value;
        ringGlowMap.offset.x = glowOffset;
        glowGlowMap.offset.x = glowOffset;

        // Spawn ripples periodically
        rippleTimer += dt;
        if (rippleTimer >= RIPPLE_INTERVAL) {
            rippleTimer = 0;
            rippleAges[nextRipple] = 0;
            nextRipple = (nextRipple + 1) % RIPPLE_COUNT;
        }

        // Update ripple uniforms — each is a normalized radius expanding outward.
        // Overshoot past 1.0 by the smoothstep band width (0.12) so the ripple
        // fully fades out at the edge instead of clipping.
        const RIPPLE_OVERSHOOT = 1.45;
        for (let i = 0; i < RIPPLE_COUNT; i++) {
            if (rippleAges[i] < 0) continue;
            rippleAges[i] += dt;
            const t = rippleAges[i] / RIPPLE_DURATION;
            if (t >= RIPPLE_OVERSHOOT) {
                rippleAges[i] = -1;
                rippleRadii.setComponent(i, -1);
            } else {
                rippleRadii.setComponent(i, t);
            }
        }

        // --- Wake trail tracking ---
        // Find current player positions via scene traversal
        // (same pattern as AtmosphericDustNode)
        const currentPlayers: { x: number; z: number }[] = [];
        scene.traverse((child) => {
            if (child.type === 'Group' && child.parent !== scene) {
                const p = child.position;
                const xzDistSq = p.x * p.x + p.z * p.z;
                if (xzDistSq < ARENA_RADIUS * ARENA_RADIUS * 4) {
                    currentPlayers.push({ x: p.x, z: p.z });
                }
            }
        });

        // Decay existing trail entries and remove fully faded ones
        for (let i = wakeTrail.length - 1; i >= 0; i--) {
            wakeTrail[i].strength -= WAKE_TRAIL_DECAY * dt;
            if (wakeTrail[i].strength <= 0) {
                wakeTrail.splice(i, 1);
            }
        }

        // Sample current player positions into trail at fixed interval.
        // Only record wake points for players that are actually moving.
        wakeTrailTimer += dt;
        if (wakeTrailTimer >= WAKE_TRAIL_INTERVAL) {
            wakeTrailTimer = 0;
            for (let i = 0; i < currentPlayers.length; i++) {
                const pos = currentPlayers[i];
                const prev = lastPlayerPositions[i];
                if (prev) {
                    const mx = pos.x - prev.x;
                    const mz = pos.z - prev.z;
                    const moveDist = Math.sqrt(mx * mx + mz * mz);
                    if (moveDist > WAKE_MIN_DISTANCE) {
                        const inv = 1 / moveDist;
                        wakeTrail.push({
                            x: pos.x,
                            z: pos.z,
                            strength: 1,
                            dirX: mx * inv,
                            dirZ: mz * inv,
                        });
                        if (wakeTrail.length > WAKE_MAX_TRAIL) {
                            wakeTrail.shift();
                        }
                    }
                }
                lastPlayerPositions[i] = { x: pos.x, z: pos.z };
            }
            // Trim if players left the scene
            lastPlayerPositions.length = currentPlayers.length;
        }

        // Rasterize wake influence and flag texture for upload.
        // On mobile, skip every other frame to halve CPU cost.
        const shouldRasterize = !mobile || ++wakeFrameSkip % 2 === 0;
        if (shouldRasterize) {
            const wakeData = wakeMap.image.data as Uint8Array;
            rasterizeWake(
                wakeData,
                wakeSize,
                wakeTrail,
                ARENA_RADIUS,
                WAKE_RADIUS,
            );
            wakeMap.needsUpdate = true;
        }
    });
}
