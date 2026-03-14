import * as THREE from 'three';
import { __fcCurrent } from '@pulse-ts/core';
import { useThreeRoot, useObject3D } from './hooks';

// ---------------------------------------------------------------------------
// Option / result types
// ---------------------------------------------------------------------------

/** Configuration for {@link useCustomMesh}. */
export interface CustomMeshOptions {
    /** Factory function that creates the geometry. The hook owns disposal. */
    geometry: () => THREE.BufferGeometry;
    /** Factory function that creates the material. The hook owns disposal. */
    material: () => THREE.Material;
    /**
     * The type of Three.js object to create.
     * @default 'mesh'
     */
    type?: 'mesh' | 'points' | 'line' | 'lineSegments';
    /**
     * Whether the object casts shadows. Only applies when `type` is `'mesh'`.
     * @default false
     */
    castShadow?: boolean;
    /**
     * Whether the object receives shadows. Only applies when `type` is `'mesh'`.
     * @default false
     */
    receiveShadow?: boolean;
}

/** Object returned by {@link useCustomMesh}. */
export interface CustomMeshResult {
    /** The Object3D root managed by `useThreeRoot`. */
    root: THREE.Object3D;
    /** The created object (Mesh, Points, Line, or LineSegments). */
    object: THREE.Mesh | THREE.Points | THREE.Line | THREE.LineSegments;
    /** The material instance created by the factory. */
    material: THREE.Material;
    /** The geometry instance created by the factory. */
    geometry: THREE.BufferGeometry;
}

// ---------------------------------------------------------------------------
// Object factory
// ---------------------------------------------------------------------------

function createObject(
    type: CustomMeshOptions['type'],
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
): THREE.Mesh | THREE.Points | THREE.Line | THREE.LineSegments {
    switch (type) {
        case 'points':
            return new THREE.Points(geometry, material);
        case 'line':
            return new THREE.Line(geometry, material);
        case 'lineSegments':
            return new THREE.LineSegments(geometry, material);
        case 'mesh':
        default:
            return new THREE.Mesh(geometry, material);
    }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Creates a custom geometry + material combination with full lifecycle management.
 *
 * Geometry and material are created from the provided factory functions and
 * disposed automatically when the node is destroyed. The resulting object is
 * added to and removed from the scene graph via `useThreeRoot` / `useObject3D`.
 *
 * @param options - Geometry factory, material factory, object type, and shadow flags.
 * @returns References to the created `{ root, object, material, geometry }`.
 *
 * @example
 * ```ts
 * import * as THREE from 'three';
 * import { useCustomMesh } from '@pulse-ts/three';
 *
 * // Custom Points (starfield)
 * function StarfieldNode() {
 *   const { root, material } = useCustomMesh({
 *     geometry: () => {
 *       const geo = new THREE.BufferGeometry();
 *       const positions = new Float32Array(1000 * 3);
 *       // ... fill positions
 *       geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
 *       return geo;
 *     },
 *     material: () => new THREE.PointsMaterial({ size: 0.1 }),
 *     type: 'points',
 *   });
 * }
 * ```
 *
 * @example
 * ```ts
 * import * as THREE from 'three';
 * import { useCustomMesh } from '@pulse-ts/three';
 *
 * // Procedural mesh with shadows
 * function TerrainNode() {
 *   const { root } = useCustomMesh({
 *     geometry: () => new THREE.PlaneGeometry(100, 100, 64, 64),
 *     material: () => new THREE.MeshStandardMaterial({ color: 0x228b22 }),
 *     castShadow: true,
 *     receiveShadow: true,
 *   });
 * }
 * ```
 */
export function useCustomMesh(options: CustomMeshOptions): CustomMeshResult {
    const root = useThreeRoot();
    const { destroy } = __fcCurrent();

    const geometry = options.geometry();
    const material = options.material();

    const object = createObject(options.type, geometry, material);

    if (options.type === 'mesh' || options.type === undefined) {
        (object as THREE.Mesh).castShadow = options.castShadow ?? false;
        (object as THREE.Mesh).receiveShadow = options.receiveShadow ?? false;
    }

    useObject3D(object);

    destroy?.push(() => {
        geometry.dispose();
        material.dispose();
    });

    return { root, object, material, geometry };
}
