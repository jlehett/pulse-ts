import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import type { ThreeService } from '@pulse-ts/three';

/**
 * Wires the holo-look post chain: ACES tone mapping plus a moderate
 * UnrealBloom pass so emissive rims and glow accents bloom.
 *
 * @param three - The installed ThreeService.
 */
export function setupPostProcessing(three: ThreeService): void {
    three.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    three.renderer.toneMappingExposure = 1.12;

    const size = three.renderer.getSize(new THREE.Vector2());
    const composer = new EffectComposer(three.renderer);
    composer.addPass(new RenderPass(three.scene, three.camera));
    composer.addPass(
        new UnrealBloomPass(
            new THREE.Vector2(size.x / 2, size.y / 2),
            0.28, // strength
            0.35, // radius
            0.88, // threshold
        ),
    );
    composer.addPass(new OutputPass());
    three.setComposer(composer);
}
