import * as THREE from 'three';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

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
// Slot state
// ---------------------------------------------------------------------------

interface ShockwaveSlot {
    active: boolean;
    centerX: number;
    centerY: number;
    elapsed: number;
    duration: number;
}

const slots: ShockwaveSlot[] = Array.from({ length: MAX_SHOCKWAVES }, () => ({
    active: false,
    centerX: 0,
    centerY: 0,
    elapsed: 0,
    duration: SHOCKWAVE_DURATION,
}));

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Trigger a shockwave at the given screen-space UV position (0–1).
 * If all slots are occupied, the oldest (highest elapsed) is recycled.
 *
 * @param screenX - Horizontal UV coordinate (0 = left, 1 = right).
 * @param screenY - Vertical UV coordinate (0 = bottom, 1 = top).
 *
 * @example
 * ```ts
 * triggerShockwave(0.5, 0.5); // center of screen
 * ```
 */
export function triggerShockwave(screenX: number, screenY: number): void {
    // Find first inactive slot
    let slot = slots.find((s) => !s.active);
    if (!slot) {
        // Recycle oldest — highest elapsed
        slot = slots.reduce((oldest, s) =>
            s.elapsed > oldest.elapsed ? s : oldest,
        );
    }
    slot.active = true;
    slot.centerX = screenX;
    slot.centerY = screenY;
    slot.elapsed = 0;
    slot.duration = SHOCKWAVE_DURATION;
}

/**
 * Advance all active shockwaves by `dt` seconds. Deactivates expired ones.
 *
 * @param dt - Frame delta time in seconds.
 *
 * @example
 * ```ts
 * updateShockwaves(1 / 60);
 * ```
 */
export function updateShockwaves(dt: number): void {
    for (const slot of slots) {
        if (!slot.active) continue;
        slot.elapsed += dt;
        if (slot.elapsed >= slot.duration) {
            slot.active = false;
        }
    }
}

/**
 * Write current shockwave state into the pass uniforms and toggle
 * `pass.enabled` based on whether any shockwave is active.
 *
 * @param pass - The ShaderPass returned by {@link createShockwavePass}.
 * @param aspect - Viewport aspect ratio (width / height).
 *
 * @example
 * ```ts
 * syncShockwaveUniforms(shockwavePass, canvas.width / canvas.height);
 * ```
 */
export function syncShockwaveUniforms(pass: ShaderPass, aspect: number): void {
    const uniforms = pass.uniforms;
    let anyActive = false;
    for (let i = 0; i < MAX_SHOCKWAVES; i++) {
        const s = slots[i];
        if (s.active) {
            anyActive = true;
            const t = s.elapsed / s.duration;
            uniforms[`center${i}`].value.set(s.centerX, s.centerY);
            uniforms[`radius${i}`].value = t * SHOCKWAVE_MAX_RADIUS;
            uniforms[`strength${i}`].value = SHOCKWAVE_STRENGTH * (1 - t);
        } else {
            uniforms[`strength${i}`].value = 0;
        }
    }
    uniforms['aspect'].value = aspect;
    pass.enabled = anyActive;
}

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
 * triggerShockwave(u, v);
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

/**
 * Returns `true` if at least one shockwave slot is active.
 *
 * @example
 * ```ts
 * if (hasActiveShockwave()) { ... }
 * ```
 */
export function hasActiveShockwave(): boolean {
    return slots.some((s) => s.active);
}

/**
 * Reset all shockwave slots to inactive. Useful for testing.
 *
 * @example
 * ```ts
 * resetShockwaves();
 * ```
 */
export function resetShockwaves(): void {
    for (const s of slots) {
        s.active = false;
        s.centerX = 0;
        s.centerY = 0;
        s.elapsed = 0;
        s.duration = SHOCKWAVE_DURATION;
    }
}
