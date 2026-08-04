import * as THREE from 'three';
import { CUSTOM_MODELS } from '../config/models';
import type { UnitDef } from '../config/types';
import { isCustomModelReady } from '../nodes/units/customModel';
import { buildRobot } from '../nodes/units/robotMesh';

const cache = new Map<string, string>();

const WIDTH = 240;
const HEIGHT = 190;

/**
 * Renders a 3D portrait snapshot of a unit's robot mesh for shop cards.
 *
 * Uses an offscreen scene + render target on the shared renderer, reads the
 * pixels back (flipping Y and converting linear → sRGB since render targets
 * bypass the renderer's output color-space conversion), and caches the
 * resulting data URL per unit definition.
 *
 * @param renderer - The live WebGL renderer to borrow for the snapshot.
 * @param def - The unit definition to portray.
 * @returns A PNG data URL of the portrait (transparent background).
 */
export function unitPortrait(
    renderer: THREE.WebGLRenderer,
    def: UnitDef,
): string {
    const cached = cache.get(def.id);
    if (cached) return cached;

    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xffffff, 0x2a3040, 0.9));
    const key = new THREE.DirectionalLight(0xffffff, 1.7);
    key.position.set(3, 6, 5);
    scene.add(key);
    const rim = new THREE.PointLight(0x33d6ff, 1.3, 20);
    rim.position.set(-3.5, 2.5, 2.5);
    scene.add(rim);

    const robot = buildRobot(def, 'player', 1);
    robot.rotation.y = 0.35;
    scene.add(robot);

    const camera = new THREE.PerspectiveCamera(26, WIDTH / HEIGHT, 0.1, 50);
    camera.position.set(0.5, 1.9, 5.6);
    camera.lookAt(0, 0.85, 0);

    const target = new THREE.WebGLRenderTarget(WIDTH, HEIGHT);
    const prevTarget = renderer.getRenderTarget();
    const prevAlpha = renderer.getClearAlpha();
    renderer.setRenderTarget(target);
    renderer.setClearAlpha(0);
    renderer.clear();
    renderer.render(scene, camera);

    const pixels = new Uint8Array(WIDTH * HEIGHT * 4);
    renderer.readRenderTargetPixels(target, 0, 0, WIDTH, HEIGHT, pixels);
    renderer.setRenderTarget(prevTarget);
    renderer.setClearAlpha(prevAlpha);
    target.dispose();
    scene.traverse((obj) => {
        // Custom-model meshes share geometry/materials with the cached
        // template — disposing them would blank every unit on the board.
        if (obj instanceof THREE.Mesh && !obj.userData.sharedAsset) {
            obj.geometry.dispose();
            (obj.material as THREE.Material).dispose();
        }
    });

    const canvas = document.createElement('canvas');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    const ctx = canvas.getContext('2d')!;
    const img = ctx.createImageData(WIDTH, HEIGHT);
    const toSRGB = (v: number) => {
        const c = v / 255;
        return Math.round(
            (c <= 0.0031308
                ? c * 12.92
                : 1.055 * Math.pow(c, 1 / 2.4) - 0.055) * 255,
        );
    };
    for (let y = 0; y < HEIGHT; y++) {
        const src = (HEIGHT - 1 - y) * WIDTH * 4;
        const dst = y * WIDTH * 4;
        for (let x = 0; x < WIDTH * 4; x += 4) {
            img.data[dst + x] = toSRGB(pixels[src + x]);
            img.data[dst + x + 1] = toSRGB(pixels[src + x + 1]);
            img.data[dst + x + 2] = toSRGB(pixels[src + x + 2]);
            img.data[dst + x + 3] = pixels[src + x + 3];
        }
    }
    ctx.putImageData(img, 0, 0);

    const url = canvas.toDataURL('image/png');
    // Don't cache a portrait rendered from the procedural placeholder
    // while a registered custom model is still loading.
    if (!CUSTOM_MODELS[def.id] || isCustomModelReady(def.id)) {
        cache.set(def.id, url);
    }
    return url;
}
