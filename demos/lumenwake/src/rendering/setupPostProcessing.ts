import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import type { ThreeService } from '@pulse-ts/three';

/**
 * Configure the post-processing pipeline for Lumenwake.
 * Heavy bloom for the radiant prism aesthetic.
 */
export function setupPostProcessing(three: ThreeService): void {
    three.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    three.renderer.toneMappingExposure = 1.0;

    const canvas = three.renderer.domElement;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    const composer = new EffectComposer(three.renderer);
    composer.addPass(new RenderPass(three.scene, three.camera));
    composer.addPass(
        new UnrealBloomPass(new THREE.Vector2(w, h), 0.8, 0.4, 0.7),
    );
    composer.addPass(new OutputPass());

    three.setComposer(composer);
}
