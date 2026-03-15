import * as THREE from 'three';
import {
    HIT_RIPPLE_DISPLACEMENT,
    HIT_RIPPLE_MAX_RADIUS,
    HIT_RIPPLE_RING_WIDTH,
} from '../../hitImpact';
import { WAKE_DISPLACEMENT } from './wake';

/** Peak emissive boost multiplier for the ripple (applied on top of base). */
export const RIPPLE_INTENSITY = 5;

/**
 * Uniforms required by the platform ripple/wake/hit-ripple shader patch.
 */
export interface PlatformShaderUniforms {
    /** Ripple normalized radii (up to 4 concurrent, -1 = inactive). */
    uRippleRadii: { value: THREE.Vector4 };
    /** Peak emissive boost multiplier for the ripple. */
    uRippleBoost: { value: number };
    /** CPU-rasterized wake influence DataTexture. */
    uWakeMap: { value: THREE.DataTexture };
    /** Maximum UV displacement applied by the wake effect. */
    uWakeDisplacement: { value: number };
    /** Hit ripple normalized radii (up to 4 concurrent, -1 = inactive). */
    uHitRippleRadii: { value: THREE.Vector4 };
    /** Hit ripple center U coordinates (up to 4). */
    uHitRippleCenterX: { value: THREE.Vector4 };
    /** Hit ripple center V coordinates (up to 4). */
    uHitRippleCenterY: { value: THREE.Vector4 };
    /** Hit ripple displacement magnitude. */
    uHitRippleDisp: { value: number };
    /** Hit ripple ring width. */
    uHitRippleWidth: { value: number };
}

/**
 * Create the full set of uniforms for the platform shader patch.
 *
 * @param wakeMap - The CPU-rasterized wake influence DataTexture.
 * @returns All uniforms needed by {@link applyPlatformShaderPatch}.
 *
 * @example
 * ```ts
 * const uniforms = createPlatformShaderUniforms(wakeMap);
 * ```
 */
export function createPlatformShaderUniforms(
    wakeMap: THREE.DataTexture,
): PlatformShaderUniforms {
    return {
        uRippleRadii: { value: new THREE.Vector4(-1, -1, -1, -1) },
        uRippleBoost: { value: RIPPLE_INTENSITY },
        uWakeMap: { value: wakeMap },
        uWakeDisplacement: { value: WAKE_DISPLACEMENT },
        uHitRippleRadii: { value: new THREE.Vector4(-1, -1, -1, -1) },
        uHitRippleCenterX: { value: new THREE.Vector4(0, 0, 0, 0) },
        uHitRippleCenterY: { value: new THREE.Vector4(0, 0, 0, 0) },
        uHitRippleDisp: { value: HIT_RIPPLE_DISPLACEMENT },
        uHitRippleWidth: { value: HIT_RIPPLE_RING_WIDTH },
    };
}

/**
 * Apply the ripple/wake/hit-ripple shader patch to a platform material.
 * Patches `onBeforeCompile` to inject custom uniforms and fragment shader
 * code that adds wake displacement, hit ripple rings, and emissive ripple boosts.
 *
 * @param material - The platform `MeshStandardMaterial` to patch.
 * @param uniforms - Uniforms created by {@link createPlatformShaderUniforms}.
 *
 * @example
 * ```ts
 * const uniforms = createPlatformShaderUniforms(wakeMap);
 * applyPlatformShaderPatch(platformMat, uniforms);
 * ```
 */
export function applyPlatformShaderPatch(
    material: THREE.MeshStandardMaterial,
    uniforms: PlatformShaderUniforms,
): void {
    material.onBeforeCompile = (shader) => {
        shader.uniforms.uRippleRadii = uniforms.uRippleRadii;
        shader.uniforms.uRippleBoost = uniforms.uRippleBoost;
        shader.uniforms.uWakeMap = uniforms.uWakeMap;
        shader.uniforms.uWakeDisplacement = uniforms.uWakeDisplacement;
        shader.uniforms.uHitRippleRadii = uniforms.uHitRippleRadii;
        shader.uniforms.uHitRippleCenterX = uniforms.uHitRippleCenterX;
        shader.uniforms.uHitRippleCenterY = uniforms.uHitRippleCenterY;
        shader.uniforms.uHitRippleDisp = uniforms.uHitRippleDisp;
        shader.uniforms.uHitRippleWidth = uniforms.uHitRippleWidth;

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
}
