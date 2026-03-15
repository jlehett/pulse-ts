import * as THREE from 'three';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import type { EffectPoolHandle } from '@pulse-ts/effects';
import { createSharedPool } from './createSharedPool';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Duration of the shockwave expansion in seconds. */
export const SHOCKWAVE_DURATION = 0.35;

/** Maximum simultaneous shockwaves. */
export const MAX_SHOCKWAVES = 4;

/** Maximum radius of the shockwave ring in NDC (0–1) space. */
export const SHOCKWAVE_MAX_RADIUS = 0.25;

/** UV displacement strength at the ring wavefront. */
export const SHOCKWAVE_STRENGTH = 0.03;

/** Width of the distortion ring band in NDC space. */
export const SHOCKWAVE_RING_WIDTH = 0.06;

// ---------------------------------------------------------------------------
// Shockwave data shape
// ---------------------------------------------------------------------------

/** Data stored in each shockwave pool slot. */
export interface ShockwaveData {
    /** Screen-space UV X coordinate (0 = left, 1 = right). */
    centerX: number;
    /** Screen-space UV Y coordinate (0 = bottom, 1 = top). */
    centerY: number;
}

// ---------------------------------------------------------------------------
// Shared pool (store + hook via factory)
// ---------------------------------------------------------------------------

/**
 * World-scoped store and hook for the shockwave effect pool.
 *
 * `ShockwaveStore` holds the pool handle; `useShockwavePool` lazily creates
 * it on first call and shares it with all subsequent callers in the same world.
 *
 * @example
 * ```ts
 * const shockwaves = useShockwavePool();
 * shockwaves.trigger({ centerX: 0.5, centerY: 0.5 });
 * ```
 */
export const { Store: ShockwaveStore, usePool: useShockwavePool } =
    createSharedPool<ShockwaveData>('shockwave', {
        size: MAX_SHOCKWAVES,
        duration: SHOCKWAVE_DURATION,
        create: () => ({ centerX: 0, centerY: 0 }),
    });

// ---------------------------------------------------------------------------
// Uniform sync
// ---------------------------------------------------------------------------

/**
 * Write current shockwave state into the pass uniforms and toggle
 * `pass.enabled` based on whether any shockwave is active.
 *
 * @param pool - The shockwave effect pool handle.
 * @param pass - The ShaderPass returned by {@link createShockwavePass}.
 * @param aspect - Viewport aspect ratio (width / height).
 *
 * @example
 * ```ts
 * syncShockwaveUniforms(pool, shockwavePass, canvas.width / canvas.height);
 * ```
 */
export function syncShockwaveUniforms(
    pool: EffectPoolHandle<ShockwaveData>,
    pass: ShaderPass,
    aspect: number,
): void {
    const uniforms = pass.uniforms;

    // Reset all slots to inactive
    for (let i = 0; i < MAX_SHOCKWAVES; i++) {
        uniforms[`strength${i}`].value = 0;
    }

    let anyActive = false;
    let slotIdx = 0;
    for (const slot of pool.active()) {
        if (slotIdx >= MAX_SHOCKWAVES) break;
        anyActive = true;
        uniforms[`center${slotIdx}`].value.set(
            slot.data.centerX,
            slot.data.centerY,
        );
        uniforms[`radius${slotIdx}`].value =
            slot.progress * SHOCKWAVE_MAX_RADIUS;
        uniforms[`strength${slotIdx}`].value =
            SHOCKWAVE_STRENGTH * (1 - slot.progress);
        slotIdx++;
    }

    uniforms['aspect'].value = aspect;
    pass.enabled = anyActive;
}

// ---------------------------------------------------------------------------
// Projection helper
// ---------------------------------------------------------------------------

/**
 * Project a world position to screen-space UV coordinates (0–1).
 *
 * @param x - World X.
 * @param y - World Y.
 * @param z - World Z.
 * @param camera - The Three.js camera used for rendering.
 * @returns `[u, v]` in 0–1 UV space (origin bottom-left).
 *
 * @example
 * ```ts
 * const [u, v] = worldToScreen(0, 1, 0, camera);
 * shockwaves.trigger({ centerX: u, centerY: v });
 * ```
 */
export function worldToScreen(
    x: number,
    y: number,
    z: number,
    camera: THREE.Camera,
): [number, number] {
    const v = new THREE.Vector3(x, y, z).project(camera);
    // project() returns NDC in -1..1; convert to 0..1 UV
    return [(v.x + 1) / 2, (v.y + 1) / 2];
}

// ---------------------------------------------------------------------------
// Shader pass factory
// ---------------------------------------------------------------------------

/**
 * Create the ShaderPass for the shockwave distortion effect.
 * The pass starts disabled and is enabled/disabled automatically
 * by {@link syncShockwaveUniforms}.
 *
 * @returns A configured `ShaderPass` ready to be added to an EffectComposer.
 *
 * @example
 * ```ts
 * const pass = createShockwavePass();
 * composer.addPass(pass);
 * ```
 */
export function createShockwavePass(): ShaderPass {
    // Build uniforms for all slots
    const uniforms: Record<string, { value: any }> = {
        tDiffuse: { value: null },
        aspect: { value: 1.0 },
        ringWidth: { value: SHOCKWAVE_RING_WIDTH },
    };
    for (let i = 0; i < MAX_SHOCKWAVES; i++) {
        uniforms[`center${i}`] = { value: new THREE.Vector2(0, 0) };
        uniforms[`radius${i}`] = { value: 0 };
        uniforms[`strength${i}`] = { value: 0 };
    }

    const pass = new ShaderPass({
        uniforms,
        vertexShader: /* glsl */ `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: /* glsl */ `
            uniform sampler2D tDiffuse;
            uniform float aspect;
            uniform float ringWidth;
            ${Array.from(
                { length: MAX_SHOCKWAVES },
                (_, i) => `
            uniform vec2 center${i};
            uniform float radius${i};
            uniform float strength${i};
            `,
            ).join('')}

            varying vec2 vUv;

            void main() {
                vec2 uv = vUv;

                ${Array.from(
                    { length: MAX_SHOCKWAVES },
                    (_, i) => `
                {
                    vec2 diff = uv - center${i};
                    diff.x *= aspect;
                    float dist = length(diff);
                    float band = abs(dist - radius${i});
                    if (band < ringWidth && strength${i} > 0.0) {
                        float factor = (1.0 - band / ringWidth) * strength${i};
                        uv += normalize(diff) * factor;
                    }
                }
                `,
                ).join('')}

                gl_FragColor = texture2D(tDiffuse, uv);
            }
        `,
    });

    pass.enabled = false;
    return pass;
}
