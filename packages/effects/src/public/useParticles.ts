import * as THREE from 'three';
import { useFrameUpdate, useDestroy } from '@pulse-ts/core';
import { useThreeRoot, useObject3D } from '@pulse-ts/three';
import {
    ParticlePool,
    type Particle,
    type Point3,
    type InitFn,
    type UpdateFn,
} from '../domain/ParticlePool';

// ---------------------------------------------------------------------------
// Shaders
// ---------------------------------------------------------------------------

const VERT = /* glsl */ `
attribute float aSize;
attribute float aOpacity;
attribute vec3 aColor;

varying float vOpacity;
varying vec3 vColor;

void main() {
    vOpacity = aOpacity;
    vColor = aColor;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

    // Perspective size attenuation
    gl_PointSize = aSize * (300.0 / -mvPosition.z);
    gl_PointSize = max(gl_PointSize, 1.0);

    gl_Position = projectionMatrix * mvPosition;
}
`;

const FRAG = /* glsl */ `
varying float vOpacity;
varying vec3 vColor;

void main() {
    // Circular soft-edged particle
    float d = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard;
    float alpha = vOpacity * (1.0 - smoothstep(0.35, 0.5, d));
    gl_FragColor = vec4(vColor, alpha);
}
`;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Blending mode for the particle material. */
export type BlendingMode = 'normal' | 'additive';

/**
 * Configuration for {@link useParticles}.
 */
export interface ParticlesOptions {
    /** Maximum simultaneous particles. */
    maxCount: number;
    /** Default point size in world units. Default: `1`. */
    size?: number;
    /** Blending mode. Default: `'normal'`. */
    blending?: BlendingMode;
    /**
     * Called once per newly spawned particle. Set velocity, color,
     * lifetime, size, and userData here.
     */
    init?: InitFn;
    /**
     * Called every frame for each alive particle (after velocity
     * auto-integration). Apply forces, fade opacity, etc.
     */
    update?: UpdateFn;
}

/**
 * Handle returned by {@link useParticles} for controlling particle emission.
 */
export interface ParticleEmitter {
    /**
     * Spawn a one-shot burst of particles.
     *
     * @param count        - Number of particles to spawn.
     * @param position     - Optional world-space origin.
     * @param initOverride - Optional init callback for this burst only.
     */
    burst(count: number, position?: Point3, initOverride?: InitFn): void;

    /** Continuous emission rate (particles/second). 0 = off. */
    rate: number;

    /** Whether continuous emission is active. */
    emitting: boolean;

    /** Number of currently alive particles (readonly). */
    readonly aliveCount: number;
}

/**
 * Callback-driven particle emitter with Three.js `Points` rendering.
 *
 * Creates a fixed-capacity particle pool that renders as a single
 * `THREE.Points` draw call. Particles are defined by `init` and `update`
 * callbacks, giving full control over behavior (gravity, wind, color
 * shifts, trails, etc.) without a rigid parameter API.
 *
 * Velocity is auto-integrated into position each frame before the `update`
 * callback runs. Particles are automatically despawned when
 * `age >= lifetime`.
 *
 * @param options - Particle system configuration.
 * @returns A {@link ParticleEmitter} for triggering bursts and controlling
 *          continuous emission.
 *
 * @example
 * ```ts
 * import { useParticles } from '@pulse-ts/effects';
 *
 * // Scene-level emitter
 * function ParticleEffectsNode() {
 *     const emitter = useParticles({
 *         maxCount: 200,
 *         size: 0.08,
 *         blending: 'additive',
 *         init: (p) => {
 *             p.lifetime = 0.6;
 *             p.velocity.randomDirection().scale(4);
 *             p.color.set(0xf4d03f);
 *         },
 *         update: (p, dt) => {
 *             p.velocity.y -= 9.8 * dt;
 *             p.opacity = 1 - p.age / p.lifetime;
 *         },
 *     });
 *
 *     // One-shot burst
 *     emitter.burst(24, [1, 2, 0]);
 *
 *     // Continuous emission
 *     emitter.rate = 50;
 *     emitter.emitting = true;
 * }
 * ```
 */
export function useParticles(options: Readonly<ParticlesOptions>): ParticleEmitter {
    const defaultSize = options.size ?? 1;

    // Wrap init to apply default size before user callback
    const wrappedInit: InitFn = (p) => {
        p.size = defaultSize;
        options.init?.(p);
    };

    const pool = new ParticlePool({
        maxCount: options.maxCount,
        init: wrappedInit,
        update: options.update,
    });

    // --- Three.js rendering setup ---

    const root = useThreeRoot();
    // Ensure emitter root stays at origin so particles use world coords
    root.position.set(0, 0, 0);

    const maxCount = options.maxCount;
    const positions = new Float32Array(maxCount * 3);
    const colors = new Float32Array(maxCount * 3);
    const opacities = new Float32Array(maxCount);
    const sizes = new Float32Array(maxCount);

    const geometry = new THREE.BufferGeometry();
    const posAttr = new THREE.BufferAttribute(positions, 3);
    const colorAttr = new THREE.BufferAttribute(colors, 3);
    const opacityAttr = new THREE.BufferAttribute(opacities, 1);
    const sizeAttr = new THREE.BufferAttribute(sizes, 1);

    geometry.setAttribute('position', posAttr);
    geometry.setAttribute('aColor', colorAttr);
    geometry.setAttribute('aOpacity', opacityAttr);
    geometry.setAttribute('aSize', sizeAttr);

    const blending =
        options.blending === 'additive'
            ? THREE.AdditiveBlending
            : THREE.NormalBlending;

    const material = new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        transparent: true,
        depthWrite: false,
        blending,
    });

    const points = new THREE.Points(geometry, material);
    useObject3D(points);

    // --- Per-frame sync ---

    useFrameUpdate((dt) => {
        pool.tick(dt);
        syncBuffers(pool, posAttr, colorAttr, opacityAttr, sizeAttr, geometry);
    });

    // --- Cleanup ---

    useDestroy(() => {
        geometry.dispose();
        material.dispose();
    });

    // --- Emitter handle ---

    return {
        burst(count: number, position?: Point3, initOverride?: InitFn) {
            // Wrap the override to also apply default size
            const wrappedOverride = initOverride
                ? (p: Particle) => { p.size = defaultSize; initOverride(p); }
                : undefined;
            pool.burst(count, position, wrappedOverride);
        },
        get rate() {
            return pool.rate;
        },
        set rate(v: number) {
            pool.rate = v;
        },
        get emitting() {
            return pool.emitting;
        },
        set emitting(v: boolean) {
            pool.emitting = v;
        },
        get aliveCount() {
            return pool.aliveCount;
        },
    };
}

// ---------------------------------------------------------------------------
// Buffer sync
// ---------------------------------------------------------------------------

/** @internal Copy alive particle data into the typed arrays. */
function syncBuffers(
    pool: ParticlePool,
    posAttr: THREE.BufferAttribute,
    colorAttr: THREE.BufferAttribute,
    opacityAttr: THREE.BufferAttribute,
    sizeAttr: THREE.BufferAttribute,
    geometry: THREE.BufferGeometry,
): void {
    const particles = pool.particles;
    let visible = 0;

    for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (!p.alive) continue;

        const i3 = visible * 3;
        posAttr.array[i3] = p.position.x;
        posAttr.array[i3 + 1] = p.position.y;
        posAttr.array[i3 + 2] = p.position.z;

        colorAttr.array[i3] = p.color.r;
        colorAttr.array[i3 + 1] = p.color.g;
        colorAttr.array[i3 + 2] = p.color.b;

        opacityAttr.array[visible] = p.opacity;
        sizeAttr.array[visible] = p.size;

        visible++;
    }

    posAttr.needsUpdate = true;
    colorAttr.needsUpdate = true;
    opacityAttr.needsUpdate = true;
    sizeAttr.needsUpdate = true;
    geometry.setDrawRange(0, visible);
}
