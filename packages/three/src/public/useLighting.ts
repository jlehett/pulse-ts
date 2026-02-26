import * as THREE from 'three';
import { useDestroy } from '@pulse-ts/core';
import { useThreeContext } from './hooks';

// ---------------------------------------------------------------------------
// useAmbientLight
// ---------------------------------------------------------------------------

/** Options for {@link useAmbientLight}. */
export interface AmbientLightOptions {
    /** Light color (hex). @default 0xffffff */
    color?: number;
    /** Light intensity. @default 1 */
    intensity?: number;
}

/**
 * Creates an `AmbientLight` and adds it to the scene. The light is
 * automatically removed when the node is destroyed.
 *
 * @param options - Color and intensity.
 * @returns The created `THREE.AmbientLight`.
 *
 * @example
 * ```ts
 * import { useAmbientLight } from '@pulse-ts/three';
 *
 * function SceneSetup() {
 *   useAmbientLight({ color: 0xb0c4de, intensity: 0.5 });
 * }
 * ```
 */
export function useAmbientLight(
    options: AmbientLightOptions = {},
): THREE.AmbientLight {
    const { scene } = useThreeContext();
    const light = new THREE.AmbientLight(options.color, options.intensity);
    scene.add(light);
    useDestroy(() => scene.remove(light));
    return light;
}

// ---------------------------------------------------------------------------
// useDirectionalLight
// ---------------------------------------------------------------------------

/** Shadow frustum bounds for a directional light. */
export interface ShadowBounds {
    /** Near clipping plane. @default 0.5 */
    near?: number;
    /** Far clipping plane. @default 500 */
    far?: number;
    /** Left edge of the frustum. @default -5 */
    left?: number;
    /** Right edge of the frustum. @default 5 */
    right?: number;
    /** Top edge of the frustum. @default 5 */
    top?: number;
    /** Bottom edge of the frustum. @default -5 */
    bottom?: number;
}

/** Options for {@link useDirectionalLight}. */
export interface DirectionalLightOptions {
    /** Light color (hex). @default 0xffffff */
    color?: number;
    /** Light intensity. @default 1 */
    intensity?: number;
    /** World-space position as `[x, y, z]`. @default [0, 10, 0] */
    position?: [number, number, number];
    /** Whether the light casts shadows. @default false */
    castShadow?: boolean;
    /** Shadow map resolution (width and height). @default 1024 */
    shadowMapSize?: number;
    /** Shadow camera frustum bounds. */
    shadowBounds?: ShadowBounds;
}

/**
 * Creates a `DirectionalLight` with optional shadow configuration and adds it
 * to the scene. The light is automatically removed when the node is destroyed.
 *
 * @param options - Color, intensity, position, and shadow settings.
 * @returns The created `THREE.DirectionalLight`.
 *
 * @example
 * ```ts
 * import { useDirectionalLight } from '@pulse-ts/three';
 *
 * function SceneSetup() {
 *   useDirectionalLight({
 *     color: 0xffffff,
 *     intensity: 1.0,
 *     position: [32, 25, 15],
 *     castShadow: true,
 *     shadowMapSize: 2048,
 *     shadowBounds: {
 *       near: 0.5,
 *       far: 100,
 *       left: -10,
 *       right: 72,
 *       top: 15,
 *       bottom: -12,
 *     },
 *   });
 * }
 * ```
 */
export function useDirectionalLight(
    options: DirectionalLightOptions = {},
): THREE.DirectionalLight {
    const { scene } = useThreeContext();
    const light = new THREE.DirectionalLight(options.color, options.intensity);

    if (options.position) {
        light.position.set(...options.position);
    }

    light.castShadow = options.castShadow ?? false;

    if (options.castShadow) {
        const mapSize = options.shadowMapSize ?? 1024;
        light.shadow.mapSize.set(mapSize, mapSize);

        if (options.shadowBounds) {
            const b = options.shadowBounds;
            if (b.near !== undefined) light.shadow.camera.near = b.near;
            if (b.far !== undefined) light.shadow.camera.far = b.far;
            if (b.left !== undefined) light.shadow.camera.left = b.left;
            if (b.right !== undefined) light.shadow.camera.right = b.right;
            if (b.top !== undefined) light.shadow.camera.top = b.top;
            if (b.bottom !== undefined) light.shadow.camera.bottom = b.bottom;
        }
    }

    scene.add(light);
    useDestroy(() => scene.remove(light));
    return light;
}

// ---------------------------------------------------------------------------
// useFog
// ---------------------------------------------------------------------------

/** Options for {@link useFog}. */
export interface FogOptions {
    /** Fog color (hex). @default 0x000000 */
    color?: number;
    /** Near distance where fog begins. @default 1 */
    near?: number;
    /** Far distance where fog is fully opaque. @default 1000 */
    far?: number;
}

/**
 * Sets linear fog on the scene. The fog is automatically cleared when the
 * node is destroyed.
 *
 * @param options - Fog color, near, and far distances.
 * @returns The created `THREE.Fog`.
 *
 * @example
 * ```ts
 * import { useFog } from '@pulse-ts/three';
 *
 * function SceneSetup() {
 *   useFog({ color: 0x0a0a1a, near: 40, far: 100 });
 * }
 * ```
 */
export function useFog(options: FogOptions = {}): THREE.Fog {
    const { scene } = useThreeContext();
    const fog = new THREE.Fog(
        options.color ?? 0x000000,
        options.near,
        options.far,
    );
    scene.fog = fog;
    useDestroy(() => {
        if (scene.fog === fog) {
            scene.fog = null;
        }
    });
    return fog;
}
