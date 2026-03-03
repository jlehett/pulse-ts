import { useObject3D } from '@pulse-ts/three';
import { useFrameUpdate } from '@pulse-ts/core';
import * as THREE from 'three';

/** Number of sprites in the reusable pool. */
export const SUPERNOVA_POOL_SIZE = 5;

/** Minimum seconds between spawns. */
export const SUPERNOVA_INTERVAL_MIN = 1.5;

/** Maximum seconds between spawns. */
export const SUPERNOVA_INTERVAL_MAX = 3;

/** Minimum radius of the spawn shell. */
export const SUPERNOVA_RADIUS_MIN = 40;

/** Maximum radius of the spawn shell. */
export const SUPERNOVA_RADIUS_MAX = 80;

/** Duration of the flash animation in seconds. */
export const SUPERNOVA_LIFETIME = 1.8;

/** Starting scale of the sprite. */
export const SUPERNOVA_SCALE_START = 0.5;

/** Ending scale of the sprite. */
export const SUPERNOVA_SCALE_END = 3.0;

/** Resolution of the procedural texture. */
export const SUPERNOVA_TEXTURE_SIZE = 128;

/**
 * Superellipse exponent controlling the lemon shape.
 * 2.0 = standard ellipse, < 2.0 = pointed ends.
 */
export const SUPERNOVA_SHAPE_EXP = 1.6;

/** HDR color multiplier to push sprites above the bloom threshold. */
export const SUPERNOVA_COLOR_BOOST = 16;

/** Number of corona rays radiating from the core. */
export const SUPERNOVA_RAY_COUNT = 6;

/** Sharpness of corona rays (higher = thinner spikes). */
export const SUPERNOVA_RAY_SHARPNESS = 4;

/** Radians the corona rotates over the full lifetime — slow spin + expansion = outward radiation. */
export const SUPERNOVA_CORONA_SPIN = Math.PI / 3;

interface SupernovaState {
    active: boolean;
    age: number;
    startRotation: number;
}

/**
 * Apply a box blur pass to RGBA pixel data in-place.
 *
 * @param src    - Source RGBA pixel array.
 * @param w      - Image width.
 * @param h      - Image height.
 * @param radius - Blur kernel half-size (total kernel = 2 * radius + 1).
 */
function blurRGBA(
    src: Uint8ClampedArray,
    w: number,
    h: number,
    radius: number,
): void {
    const tmp = new Uint8ClampedArray(src.length);
    const kSize = 2 * radius + 1;

    // Horizontal pass → tmp
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            let rSum = 0,
                gSum = 0,
                bSum = 0,
                aSum = 0;
            for (let k = -radius; k <= radius; k++) {
                const sx = Math.min(w - 1, Math.max(0, x + k));
                const si = (y * w + sx) * 4;
                rSum += src[si];
                gSum += src[si + 1];
                bSum += src[si + 2];
                aSum += src[si + 3];
            }
            const di = (y * w + x) * 4;
            tmp[di] = rSum / kSize;
            tmp[di + 1] = gSum / kSize;
            tmp[di + 2] = bSum / kSize;
            tmp[di + 3] = aSum / kSize;
        }
    }

    // Vertical pass → src
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            let rSum = 0,
                gSum = 0,
                bSum = 0,
                aSum = 0;
            for (let k = -radius; k <= radius; k++) {
                const sy = Math.min(h - 1, Math.max(0, y + k));
                const si = (sy * w + x) * 4;
                rSum += tmp[si];
                gSum += tmp[si + 1];
                bSum += tmp[si + 2];
                aSum += tmp[si + 3];
            }
            const di = (y * w + x) * 4;
            src[di] = rSum / kSize;
            src[di + 1] = gSum / kSize;
            src[di + 2] = bSum / kSize;
            src[di + 3] = aSum / kSize;
        }
    }
}

/**
 * Create a lemon-shaped `CanvasTexture` with corona rays for the supernova.
 *
 * The core uses a superellipse distance function ({@link SUPERNOVA_SHAPE_EXP})
 * for pointed lemon ends. Radial corona rays ({@link SUPERNOVA_RAY_COUNT})
 * extend beyond the core, fading from white to warm orange. A box blur softens
 * the result to avoid jagged edges on the corona spikes.
 *
 * @param size - Width and height of the canvas in pixels.
 * @returns A `THREE.CanvasTexture` ready for use on a `SpriteMaterial`.
 *
 * @example
 * ```ts
 * const tex = createSupernovaTexture(128);
 * const mat = new THREE.SpriteMaterial({ map: tex });
 * ```
 */
export function createSupernovaTexture(size: number): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d')!;
    const imageData = ctx.createImageData(size, size);
    const data = imageData.data;

    const half = size / 2;
    const exp = SUPERNOVA_SHAPE_EXP;
    const invExp = 1 / exp;

    // Lemon proportions: narrower on x, taller on y
    const xScale = 0.45;
    const yScale = 0.55;

    // Corona ray parameters
    const rayHalfCount = SUPERNOVA_RAY_COUNT;
    const raySharp = SUPERNOVA_RAY_SHARPNESS;
    const rayReach = 0.9;

    for (let py = 0; py < size; py++) {
        for (let px = 0; px < size; px++) {
            const nx = (px - half + 0.5) / half;
            const ny = (py - half + 0.5) / half;

            // --- Lemon core (superellipse) ---
            const ax = Math.abs(nx / xScale);
            const ay = Math.abs(ny / yScale);
            const d = Math.pow(Math.pow(ax, exp) + Math.pow(ay, exp), invExp);

            let coreR: number, coreG: number, coreB: number, coreA: number;
            if (d < 0.3) {
                const t = d / 0.3;
                coreR = 255;
                coreG = 255 - t * 15;
                coreB = 255 - t * 135;
                coreA = 1;
            } else if (d < 0.65) {
                const t = (d - 0.3) / 0.35;
                coreR = 255;
                coreG = 240 - t * 80;
                coreB = 120 - t * 70;
                coreA = 0.9 - t * 0.5;
            } else if (d < 1.0) {
                const t = (d - 0.65) / 0.35;
                coreR = 255;
                coreG = 160 - t * 80;
                coreB = 50 - t * 30;
                coreA = 0.4 * (1 - t);
            } else {
                coreR = 0;
                coreG = 0;
                coreB = 0;
                coreA = 0;
            }

            // --- Corona rays ---
            const radial = Math.sqrt(nx * nx + ny * ny);
            const angle = Math.atan2(ny, nx);
            const rayPattern = Math.pow(
                Math.abs(Math.cos(angle * rayHalfCount)),
                raySharp,
            );
            const rayFalloff = Math.max(0, 1 - radial / rayReach);
            const rayA = rayPattern * rayFalloff * rayFalloff * 0.6;

            // Ray color: bright white at center, warm at tips
            const rayT = Math.min(1, radial / rayReach);
            const rayR = 255;
            const rayG = 255 - rayT * 60;
            const rayB = 255 - rayT * 180;

            // Combine: additive blend of core + rays, clamped to 0–255
            const a = Math.min(1, coreA + rayA);
            const r = Math.min(255, coreR * coreA + rayR * rayA);
            const g = Math.min(255, coreG * coreA + rayG * rayA);
            const b = Math.min(255, coreB * coreA + rayB * rayA);

            const idx = (py * size + px) * 4;
            data[idx] = r;
            data[idx + 1] = g;
            data[idx + 2] = b;
            data[idx + 3] = a * 255;
        }
    }

    // Soften the corona spikes with two box blur passes (approximates Gaussian)
    blurRGBA(data, size, size, 2);
    blurRGBA(data, size, size, 2);

    ctx.putImageData(imageData, 0, 0);
    return new THREE.CanvasTexture(canvas);
}

/**
 * Return a random point on a sphere shell between `rMin` and `rMax`.
 *
 * @param rMin - Minimum shell radius.
 * @param rMax - Maximum shell radius.
 * @returns A `THREE.Vector3` at a uniformly distributed position on the shell.
 *
 * @example
 * ```ts
 * const pos = randomSpherePoint(40, 80);
 * sprite.position.copy(pos);
 * ```
 */
export function randomSpherePoint(rMin: number, rMax: number): THREE.Vector3 {
    const r = rMin + Math.random() * (rMax - rMin);
    const theta = Math.acos(2 * Math.random() - 1);
    const phi = Math.random() * Math.PI * 2;
    const sinTheta = Math.sin(theta);
    return new THREE.Vector3(
        r * sinTheta * Math.cos(phi),
        r * Math.cos(theta),
        r * sinTheta * Math.sin(phi),
    );
}

/**
 * Miniature supernova flashes in the starfield shell.
 *
 * Uses a small pool of `THREE.Sprite` objects with additive blending.
 * Periodically spawns a flash at a random shell position that scales up
 * and fades out over {@link SUPERNOVA_LIFETIME} seconds.
 *
 * @example
 * ```ts
 * useChild(SupernovaNode);
 * ```
 */
export function SupernovaNode() {
    const texture = createSupernovaTexture(SUPERNOVA_TEXTURE_SIZE);
    const group = new THREE.Group();

    const sprites: THREE.Sprite[] = [];
    const states: SupernovaState[] = [];

    // HDR near-white color to push additive sprites well above bloom threshold
    const hdrColor = new THREE.Color(
        SUPERNOVA_COLOR_BOOST,
        SUPERNOVA_COLOR_BOOST * 0.95,
        SUPERNOVA_COLOR_BOOST * 0.88,
    );

    for (let i = 0; i < SUPERNOVA_POOL_SIZE; i++) {
        const material = new THREE.SpriteMaterial({
            map: texture,
            color: hdrColor,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            fog: false,
            transparent: true,
            opacity: 0,
            toneMapped: false,
        });
        const sprite = new THREE.Sprite(material);
        sprite.visible = false;
        group.add(sprite);
        sprites.push(sprite);
        states.push({ active: false, age: 0, startRotation: 0 });
    }

    useObject3D(group);

    let timer =
        SUPERNOVA_INTERVAL_MIN +
        Math.random() * (SUPERNOVA_INTERVAL_MAX - SUPERNOVA_INTERVAL_MIN);

    useFrameUpdate((dt) => {
        // Spawn timer
        timer -= dt;
        if (timer <= 0) {
            timer =
                SUPERNOVA_INTERVAL_MIN +
                Math.random() *
                    (SUPERNOVA_INTERVAL_MAX - SUPERNOVA_INTERVAL_MIN);

            // Find an inactive sprite
            for (let i = 0; i < SUPERNOVA_POOL_SIZE; i++) {
                if (!states[i].active) {
                    const pos = randomSpherePoint(
                        SUPERNOVA_RADIUS_MIN,
                        SUPERNOVA_RADIUS_MAX,
                    );
                    sprites[i].position.copy(pos);
                    sprites[i].visible = true;
                    states[i].startRotation = Math.random() * Math.PI * 2;
                    states[i].active = true;
                    states[i].age = 0;
                    break;
                }
            }
        }

        // Animate active sprites
        for (let i = 0; i < SUPERNOVA_POOL_SIZE; i++) {
            if (!states[i].active) continue;

            states[i].age += dt;
            const t = states[i].age / SUPERNOVA_LIFETIME;

            if (t >= 1) {
                // Deactivate
                sprites[i].visible = false;
                (sprites[i].material as THREE.SpriteMaterial).opacity = 0;
                states[i].active = false;
                continue;
            }

            // Scale: ease-out quadratic expansion
            const easeOut = 1 - (1 - t) * (1 - t);
            const scale =
                SUPERNOVA_SCALE_START +
                (SUPERNOVA_SCALE_END - SUPERNOVA_SCALE_START) * easeOut;
            sprites[i].scale.setScalar(scale);

            // Opacity: ramp up (0–10%), sustain (10–30%), fade out (30–100%)
            let opacity: number;
            if (t < 0.1) {
                opacity = t / 0.1;
            } else if (t < 0.3) {
                opacity = 1;
            } else {
                opacity = 1 - (t - 0.3) / 0.7;
            }
            const mat = sprites[i].material as THREE.SpriteMaterial;
            mat.opacity = opacity;

            // Corona spin: slow rotation over lifetime creates outward radiation
            mat.rotation =
                states[i].startRotation + easeOut * SUPERNOVA_CORONA_SPIN;
        }
    });
}
