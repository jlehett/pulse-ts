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

    const bloomRes = new THREE.Vector2(Math.floor(w / 2), Math.floor(h / 2));
    const bloom = new UnrealBloomPass(bloomRes, 0.5, 0.4, 0.85);
    bloom.renderToScreen = false;

    const composer = new EffectComposer(three.renderer);
    composer.setPixelRatio(window.devicePixelRatio);
    composer.addPass(new RenderPass(three.scene, three.camera));
    composer.addPass(bloom);
    composer.addPass(new OutputPass());

    three.setComposer(composer);
}
