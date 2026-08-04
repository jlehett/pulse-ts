import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { ThreeService } from '@pulse-ts/three';

/**
 * Configures the renderer to match the imported design's look: ACES tone
 * mapping at 0.95 exposure with three's color management disabled.
 *
 * The design ran three r128, which fed hex colors raw into the lighting
 * pipeline and then applied the sRGB output transform — modern three
 * linearizes inputs first and renders the same palette far darker and more
 * saturated. Disabling color management restores the legacy pipeline the
 * design's palette was authored against. The design also uses no bloom pass;
 * all glow comes from emissive materials under tone mapping.
 *
 * Also installs a neutral studio environment map. The procedural robots glow
 * via emissive materials, but imported GLB models rely on standard PBR
 * metalness — with no environment to reflect, those metallic surfaces render
 * near-black regardless of how many lights are added. The PMREM-baked room
 * gives them something to catch; `environmentIntensity` keeps it subtle so
 * the authored emissive palette still leads.
 *
 * @param three - The installed ThreeService.
 */
export function setupRenderer(three: ThreeService): void {
    THREE.ColorManagement.enabled = false;
    three.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    three.renderer.toneMappingExposure = 0.95;

    const pmrem = new THREE.PMREMGenerator(three.renderer);
    three.scene.environment = pmrem.fromScene(
        new RoomEnvironment(),
        0.04,
    ).texture;
    three.scene.environmentIntensity = 0.6;
    pmrem.dispose();
}
