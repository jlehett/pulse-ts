import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import type { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import type { ThreeService } from '@pulse-ts/three';
import { createShockwavePass } from '../stores/shockwave';

/** Options for {@link setupPostProcessing}. */
export interface PostProcessingOptions {
    /** Skip the bloom pass (saves ~25% GPU on mobile). */
    skipBloom?: boolean;
}

/**
 * Configure the post-processing pipeline for the arena demo.
 *
 * Sets up ACESFilmic tone mapping and an EffectComposer with:
 * - {@link RenderPass} — renders the scene
 * - {@link UnrealBloomPass} — subtle glow on bright/emissive elements (skipped when `skipBloom`)
 * - Shockwave `ShaderPass` — radial distortion ring on impact (starts disabled)
 * - {@link OutputPass} — tone mapping and color-space conversion
 *
 * @param three - The ThreeService instance from `installThree()`.
 * @param options - Optional configuration.
 *
 * @returns The shockwave `ShaderPass`, needed by `ShockwaveNode` to sync uniforms.
 *
 * @example
 * ```ts
 * const three = installThree(world, { canvas, clearColor: 0x0a0a1a });
 * const shockwavePass = setupPostProcessing(three);
 * ```
 */
export function setupPostProcessing(
    three: ThreeService,
    options?: PostProcessingOptions,
): ShaderPass {
    three.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    three.renderer.toneMappingExposure = 1.0;

    const canvas = three.renderer.domElement;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    const composer = new EffectComposer(three.renderer);
    composer.addPass(new RenderPass(three.scene, three.camera));

    if (!options?.skipBloom) {
        composer.addPass(
            new UnrealBloomPass(new THREE.Vector2(w, h), 0.4, 0.3, 0.85),
        );
    }

    const shockwavePass = createShockwavePass();
    composer.addPass(shockwavePass);

    composer.addPass(new OutputPass());

    three.setComposer(composer);

    return shockwavePass;
}
