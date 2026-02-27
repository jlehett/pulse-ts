import * as THREE from 'three';
import { Service } from '@pulse-ts/core';
import {
    ParticlePool,
    type Particle,
    type Point3,
    type InitFn,
    type UpdateFn,
} from './ParticlePool';
import type { BlendingMode } from '../public/useParticles';

// ---------------------------------------------------------------------------
// Shaders (shared with useParticles — identical vertex/fragment)
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

/**
 * Options for configuring the particle service via {@link installParticles}.
 */
export interface ParticlesInstallOptions {
    /** Maximum particles per pool. Default: `500`. */
    maxPerPool?: number;
    /** Default point size in world units. Default: `0.08`. */
    defaultSize?: number;
}

/**
 * Declarative options shared by {@link useParticleBurst} and
 * {@link useParticleEmitter} for configuring particle appearance and behavior.
 */
export interface ParticleStyleOptions {
    /** Particle lifetime in seconds. */
    lifetime: number;
    /** Hex color (e.g. `0xf4d03f`). */
    color: number;
    /** Speed range `[min, max]` for random initial velocity. */
    speed: [number, number];
    /** Downward gravity in units/s^2. Default: `0` (no gravity). */
    gravity?: number;
    /** Point size in world units. Uses service default if omitted. */
    size?: number;
    /** Blending mode for the pool. Default: `'normal'`. */
    blending?: BlendingMode;
    /** Starting opacity 0-1. Default: `1`. */
    opacity?: number;
    /** Whether particles shrink to 0 over their lifetime. Default: `false`. */
    shrink?: boolean;
    /**
     * Optional init callback that runs **after** built-in initialization.
     * Use to set custom `userData` or override defaults.
     */
    init?: InitFn;
    /**
     * Optional update callback that runs **after** built-in update
     * (gravity, fade, shrink). Use for custom per-frame behavior.
     */
    update?: UpdateFn;
}

/** Internal struct for a managed pool and its Three.js resources. */
export interface ManagedPool {
    pool: ParticlePool;
    geometry: THREE.BufferGeometry;
    material: THREE.ShaderMaterial;
    points: THREE.Points;
    posAttr: THREE.BufferAttribute;
    colorAttr: THREE.BufferAttribute;
    opacityAttr: THREE.BufferAttribute;
    sizeAttr: THREE.BufferAttribute;
}

// ---------------------------------------------------------------------------
// Generic per-particle update
// ---------------------------------------------------------------------------

/**
 * Reads per-particle behavior flags from `userData` and applies gravity,
 * opacity fade, and size shrink. Called by the pool's update function
 * before any user-supplied update callback.
 *
 * @param p  - The particle to update.
 * @param dt - Delta time in seconds.
 * @internal
 */
export function genericUpdate(p: Particle, dt: number): void {
    const gravity = p.userData._gravity as number | undefined;
    if (gravity) {
        p.velocity.y -= gravity * dt;
    }

    const fadeOut = p.userData._fadeOut as boolean | undefined;
    if (fadeOut) {
        p.opacity = Math.max(0, 1 - p.age / p.lifetime);
    }

    const shrink = p.userData._shrink as boolean | undefined;
    if (shrink) {
        const baseSize = p.userData._baseSize as number;
        p.size = baseSize * Math.max(0, 1 - p.age / p.lifetime);
    }
}

// ---------------------------------------------------------------------------
// Init / Update builders
// ---------------------------------------------------------------------------

/**
 * Constructs an {@link InitFn} from declarative style options.
 *
 * Sets lifetime, random-direction velocity within the speed range,
 * color, size, opacity, and writes behavior flags to `userData`.
 * If the user passed an `init` callback, it runs **after** the built-in init.
 *
 * @param options     - Declarative particle style options.
 * @param defaultSize - Fallback size from the service configuration.
 * @returns A composite init function.
 * @internal
 */
export function buildInit(
    options: Readonly<ParticleStyleOptions>,
    defaultSize: number,
): InitFn {
    const {
        lifetime,
        color,
        speed,
        gravity = 0,
        size,
        opacity = 1,
        shrink = false,
        init: userInit,
    } = options;
    const particleSize = size ?? defaultSize;
    const [minSpeed, maxSpeed] = speed;

    return (p: Particle) => {
        p.lifetime = lifetime;
        p.velocity.randomDirection().scale(
            minSpeed + Math.random() * (maxSpeed - minSpeed),
        );
        p.color.set(color);
        p.size = particleSize;
        p.opacity = opacity;

        // Behavior flags read by genericUpdate
        p.userData._gravity = gravity;
        p.userData._fadeOut = true;
        p.userData._shrink = shrink;
        p.userData._baseSize = particleSize;

        userInit?.(p);
    };
}

/**
 * Constructs an {@link UpdateFn} that runs {@link genericUpdate} first,
 * then the user's optional `update` callback.
 *
 * @param options - Declarative particle style options.
 * @returns A composite update function.
 * @internal
 */
export function buildUpdate(options: Readonly<ParticleStyleOptions>): UpdateFn {
    const userUpdate = options.update;
    return (p: Particle, dt: number) => {
        genericUpdate(p, dt);
        userUpdate?.(p, dt);
    };
}

// ---------------------------------------------------------------------------
// ParticlesService
// ---------------------------------------------------------------------------

/**
 * World-level service that manages shared particle pools keyed by
 * {@link BlendingMode}.
 *
 * Pools are created lazily — the first hook requesting a given blending mode
 * creates the pool and its Three.js resources. Each pool has a single generic
 * update function that reads per-particle config from `userData`, so one pool
 * can serve many different burst/emitter configurations.
 *
 * @example
 * ```ts
 * import { installParticles } from '@pulse-ts/effects';
 *
 * function RootNode() {
 *     const service = installParticles();
 *     // Hooks like useParticleBurst automatically find this service.
 * }
 * ```
 */
export class ParticlesService extends Service {
    /** Scene graph parent for pool Points objects. */
    private _root: THREE.Object3D | null = null;

    /** Pools keyed by blending mode. */
    private readonly _pools = new Map<string, ManagedPool>();

    /** Maximum particles per pool. */
    readonly maxPerPool: number;

    /** Default point size in world units. */
    readonly defaultSize: number;

    /**
     * @param options - Optional service configuration.
     */
    constructor(options: ParticlesInstallOptions = {}) {
        super();
        this.maxPerPool = options.maxPerPool ?? 500;
        this.defaultSize = options.defaultSize ?? 0.08;
    }

    /**
     * Set the scene graph root that pool `Points` objects are added to.
     *
     * @param root - A Three.js Object3D to parent pool points under.
     */
    setRoot(root: THREE.Object3D): void {
        this._root = root;

        // Attach any pools that were created before the root was set
        for (const managed of this._pools.values()) {
            if (!managed.points.parent) {
                root.add(managed.points);
            }
        }
    }

    /**
     * Get or lazily create a pool for the given blending mode.
     *
     * @param blending - The blending mode. Default: `'normal'`.
     * @returns The managed pool struct.
     */
    getPool(blending: BlendingMode = 'normal'): ManagedPool {
        let managed = this._pools.get(blending);
        if (managed) return managed;

        const maxCount = this.maxPerPool;

        // Create the particle pool — no pool-level init/update since each
        // particle carries its own config in userData
        const pool = new ParticlePool({ maxCount });

        // Three.js buffers
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

        const threeBlending =
            blending === 'additive'
                ? THREE.AdditiveBlending
                : THREE.NormalBlending;

        const material = new THREE.ShaderMaterial({
            vertexShader: VERT,
            fragmentShader: FRAG,
            transparent: true,
            depthWrite: false,
            blending: threeBlending,
        });

        const points = new THREE.Points(geometry, material);
        points.frustumCulled = false;

        if (this._root) {
            this._root.add(points);
        }

        managed = { pool, geometry, material, points, posAttr, colorAttr, opacityAttr, sizeAttr };
        this._pools.set(blending, managed);
        return managed;
    }

    /**
     * Advance all pools by `dt` seconds and sync Three.js buffers.
     *
     * @param dt - Delta time in seconds.
     */
    tick(dt: number): void {
        for (const managed of this._pools.values()) {
            managed.pool.tick(dt);
            syncBuffers(managed);
        }
    }

    /**
     * Dispose all Three.js resources and clear pools.
     */
    dispose(): void {
        for (const managed of this._pools.values()) {
            if (managed.points.parent) {
                managed.points.parent.remove(managed.points);
            }
            managed.geometry.dispose();
            managed.material.dispose();
        }
        this._pools.clear();
    }
}

// ---------------------------------------------------------------------------
// Buffer sync (same logic as useParticles)
// ---------------------------------------------------------------------------

/** @internal Copy alive particle data into the typed arrays. */
function syncBuffers(managed: ManagedPool): void {
    const { pool, posAttr, colorAttr, opacityAttr, sizeAttr, geometry } = managed;
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
