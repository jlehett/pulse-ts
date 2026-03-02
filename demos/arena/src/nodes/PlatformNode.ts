import { useComponent, Transform, useFrameUpdate } from '@pulse-ts/core';
import { useRigidBody, useCylinderCollider } from '@pulse-ts/physics';
import { useMesh, useObject3D } from '@pulse-ts/three';
import { useAnimate } from '@pulse-ts/effects';
import * as THREE from 'three';
import { ARENA_RADIUS } from '../config/arena';

/** Radius of the arena cylinder (sourced from arena config). */
export const PLATFORM_RADIUS = ARENA_RADIUS;

/** Height (thickness) of the arena cylinder. */
export const PLATFORM_HEIGHT = 0.5;

/** Color of the platform surface. */
const PLATFORM_COLOR = 0x3a5a6a;

/** Color of the emissive edge ring. */
const RING_COLOR = 0x00ccff;

/** Size (width and height) of the generated grid normal map in pixels. */
const NORMAL_MAP_SIZE = 256;

/** Spacing between grid lines in pixels. */
const GRID_SPACING = 32;

/**
 * Generate a procedural grid normal map as a `DataTexture`.
 * Lines at regular intervals perturb the normal slightly,
 * giving the flat surface a subtle tiled look under lighting.
 *
 * @param size - Texture width and height in pixels.
 * @param spacing - Pixel spacing between grid lines.
 * @returns A `THREE.DataTexture` encoded as an RGB normal map.
 *
 * @example
 * ```ts
 * const tex = createGridNormalMap(256, 32);
 * material.normalMap = tex;
 * ```
 */
export function createGridNormalMap(
    size: number = NORMAL_MAP_SIZE,
    spacing: number = GRID_SPACING,
): THREE.DataTexture {
    const data = new Uint8Array(size * size * 3);
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const i = (y * size + x) * 3;
            // Default flat normal: (0.5, 0.5, 1.0) in [0,1] → (0, 0, 1) in [-1,1]
            let nx = 128;
            let ny = 128;
            const nz = 255;

            // Perturb normals at grid-line boundaries
            if (x % spacing === 0) nx = 96; // tilt left at vertical lines
            if (y % spacing === 0) ny = 96; // tilt down at horizontal lines

            data[i] = nx;
            data[i + 1] = ny;
            data[i + 2] = nz;
        }
    }
    const tex = new THREE.DataTexture(data, size, size, THREE.RGBFormat);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.needsUpdate = true;
    return tex;
}

/**
 * Circular arena platform — a flat cylinder with a pulsing emissive torus
 * around its edge. Uses a cylinder collider for accurate circular collision
 * (no edge walls so players can be knocked off).
 */
export function PlatformNode() {
    const transform = useComponent(Transform);
    transform.localPosition.set(0, 0, 0);

    // Physics — static cylinder collider matching the visual cylinder
    useRigidBody({ type: 'static' });
    useCylinderCollider(PLATFORM_RADIUS, PLATFORM_HEIGHT / 2, {
        friction: 0.6,
        restitution: 0,
    });

    // Visual — cylinder mesh for the platform surface
    const { material: platformMat } = useMesh('cylinder', {
        radius: PLATFORM_RADIUS,
        height: PLATFORM_HEIGHT,
        radialSegments: 48,
        color: PLATFORM_COLOR,
        roughness: 0.7,
        metalness: 0.2,
        receiveShadow: true,
    });

    // Procedural grid normal map — subtle tiled surface detail
    const normalMap = createGridNormalMap();
    platformMat.normalMap = normalMap;
    platformMat.normalScale = new THREE.Vector2(0.3, 0.3);

    // Decorative edge ring — torus sitting at the platform rim
    const ringGeometry = new THREE.TorusGeometry(PLATFORM_RADIUS, 0.08, 12, 64);
    const ringMaterial = new THREE.MeshStandardMaterial({
        color: RING_COLOR,
        emissive: RING_COLOR,
        emissiveIntensity: 0.6,
        roughness: 0.3,
        metalness: 0.5,
    });
    const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
    ringMesh.rotation.x = -Math.PI / 2; // lay flat
    ringMesh.position.y = PLATFORM_HEIGHT / 2; // sit on top edge
    useObject3D(ringMesh);

    // Pulsing glow on the ring
    const pulse = useAnimate({
        wave: 'sine',
        min: 0.3,
        max: 1.0,
        frequency: 1.5,
    });

    useFrameUpdate(() => {
        ringMaterial.emissiveIntensity = pulse.value;
    });
}
