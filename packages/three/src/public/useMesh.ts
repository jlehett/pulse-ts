import * as THREE from 'three';
import { useThreeRoot, useObject3D } from './hooks';

// ---------------------------------------------------------------------------
// Geometry option types
// ---------------------------------------------------------------------------

/** Options specific to a box geometry. */
export interface BoxGeometryOptions {
    /** Width, height, depth as `[w, h, d]`. */
    size: [number, number, number];
}

/** Options specific to a sphere geometry. */
export interface SphereGeometryOptions {
    /** Sphere radius. @default 1 */
    radius?: number;
    /** Horizontal segments. @default 32 */
    widthSegments?: number;
    /** Vertical segments. @default 16 */
    heightSegments?: number;
}

/** Options specific to a capsule geometry. */
export interface CapsuleGeometryOptions {
    /** Capsule radius. @default 1 */
    radius?: number;
    /** Length of the middle cylindrical section. @default 1 */
    length?: number;
    /** Number of subdivisions around the cap. @default 4 */
    capSegments?: number;
    /** Radial segments. @default 8 */
    radialSegments?: number;
}

/** Options specific to a cylinder geometry. */
export interface CylinderGeometryOptions {
    /** Sets both `radiusTop` and `radiusBottom`. @default 1 */
    radius?: number;
    /** Overrides `radius` for the top face. */
    radiusTop?: number;
    /** Overrides `radius` for the bottom face. */
    radiusBottom?: number;
    /** Cylinder height. @default 1 */
    height?: number;
    /** Radial segments. @default 32 */
    radialSegments?: number;
}

/** Options specific to a cone geometry. */
export interface ConeGeometryOptions {
    /** Base radius. @default 1 */
    radius?: number;
    /** Cone height. @default 1 */
    height?: number;
    /** Radial segments. @default 32 */
    radialSegments?: number;
}

/** Options specific to an icosahedron geometry. */
export interface IcosahedronGeometryOptions {
    /** Icosahedron radius. @default 1 */
    radius?: number;
    /** Subdivision detail. @default 0 */
    detail?: number;
}

/** Options specific to an octahedron geometry. */
export interface OctahedronGeometryOptions {
    /** Octahedron radius. @default 1 */
    radius?: number;
    /** Subdivision detail. @default 0 */
    detail?: number;
}

/** Options specific to a plane geometry. */
export interface PlaneGeometryOptions {
    /** Plane width. @default 1 */
    width?: number;
    /** Plane height. @default 1 */
    height?: number;
}

/** Options specific to a torus geometry. */
export interface TorusGeometryOptions {
    /** Major (ring) radius. @default 1 */
    radius?: number;
    /** Minor (tube) radius. @default 0.4 */
    tube?: number;
}

// ---------------------------------------------------------------------------
// Geometry type map
// ---------------------------------------------------------------------------

/** Maps each geometry type string to its option interface. */
export interface GeometryTypeMap {
    box: BoxGeometryOptions;
    sphere: SphereGeometryOptions;
    capsule: CapsuleGeometryOptions;
    cylinder: CylinderGeometryOptions;
    cone: ConeGeometryOptions;
    icosahedron: IcosahedronGeometryOptions;
    octahedron: OctahedronGeometryOptions;
    plane: PlaneGeometryOptions;
    torus: TorusGeometryOptions;
}

/** Valid geometry type strings. */
export type GeometryType = keyof GeometryTypeMap;

// ---------------------------------------------------------------------------
// Shared option types
// ---------------------------------------------------------------------------

/** Material options forwarded to `THREE.MeshStandardMaterial`. */
export interface MeshMaterialOptions {
    /** Mesh color (hex). @default 0xcccccc */
    color?: number;
    /** Surface roughness `[0, 1]`. @default 1 */
    roughness?: number;
    /** Metalness `[0, 1]`. @default 0 */
    metalness?: number;
    /** Emissive color (hex). */
    emissive?: number;
    /** Emissive intensity. @default 1 */
    emissiveIntensity?: number;
    /** Whether the material is transparent. @default false */
    transparent?: boolean;
    /** Opacity `[0, 1]`. Only effective when `transparent` is true. @default 1 */
    opacity?: number;
}

/** Shadow options applied to the mesh. */
export interface MeshShadowOptions {
    /** Whether the mesh casts shadows. @default false */
    castShadow?: boolean;
    /** Whether the mesh receives shadows. @default false */
    receiveShadow?: boolean;
}

/** Combined options for a given geometry type. */
export type UseMeshOptions<T extends GeometryType> = GeometryTypeMap[T] &
    MeshMaterialOptions &
    MeshShadowOptions;

// ---------------------------------------------------------------------------
// Return type
// ---------------------------------------------------------------------------

/** Object returned by {@link useMesh}. */
export interface UseMeshResult {
    /** The Object3D root managed by `useThreeRoot`. */
    root: THREE.Object3D;
    /** The created `THREE.Mesh`. */
    mesh: THREE.Mesh;
    /** The `MeshStandardMaterial` instance. */
    material: THREE.MeshStandardMaterial;
    /** The `BufferGeometry` instance. */
    geometry: THREE.BufferGeometry;
}

// ---------------------------------------------------------------------------
// Geometry factory
// ---------------------------------------------------------------------------

function createGeometry<T extends GeometryType>(
    type: T,
    opts: GeometryTypeMap[T],
): THREE.BufferGeometry {
    switch (type) {
        case 'box': {
            const o = opts as BoxGeometryOptions;
            return new THREE.BoxGeometry(o.size[0], o.size[1], o.size[2]);
        }
        case 'sphere': {
            const o = opts as SphereGeometryOptions;
            return new THREE.SphereGeometry(
                o.radius,
                o.widthSegments,
                o.heightSegments,
            );
        }
        case 'capsule': {
            const o = opts as CapsuleGeometryOptions;
            return new THREE.CapsuleGeometry(
                o.radius,
                o.length,
                o.capSegments,
                o.radialSegments,
            );
        }
        case 'cylinder': {
            const o = opts as CylinderGeometryOptions;
            const top = o.radiusTop ?? o.radius;
            const bot = o.radiusBottom ?? o.radius;
            return new THREE.CylinderGeometry(
                top,
                bot,
                o.height,
                o.radialSegments,
            );
        }
        case 'cone': {
            const o = opts as ConeGeometryOptions;
            return new THREE.ConeGeometry(
                o.radius,
                o.height,
                o.radialSegments,
            );
        }
        case 'icosahedron': {
            const o = opts as IcosahedronGeometryOptions;
            return new THREE.IcosahedronGeometry(o.radius, o.detail);
        }
        case 'octahedron': {
            const o = opts as OctahedronGeometryOptions;
            return new THREE.OctahedronGeometry(o.radius, o.detail);
        }
        case 'plane': {
            const o = opts as PlaneGeometryOptions;
            return new THREE.PlaneGeometry(o.width, o.height);
        }
        case 'torus': {
            const o = opts as TorusGeometryOptions;
            return new THREE.TorusGeometry(o.radius, o.tube);
        }
        default:
            throw new Error(`useMesh: unknown geometry type "${type}"`);
    }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Creates a `THREE.Mesh` with the specified geometry, material, and shadow
 * settings, and attaches it to the current node's Three.js root.
 *
 * Combines `useThreeRoot()`, geometry creation, `MeshStandardMaterial` setup,
 * shadow configuration, and `useObject3D()` into a single declarative call.
 * Returns all internals so callers can still modify them after creation
 * (e.g. animating emissive intensity or reading `mesh.rotation`).
 *
 * @param type - The geometry type to create (e.g. `'box'`, `'sphere'`, `'capsule'`).
 * @param options - Geometry dimensions, material properties, and shadow flags.
 * @returns An object containing `{ root, mesh, material, geometry }`.
 *
 * @example
 * ```ts
 * import { useMesh } from '@pulse-ts/three';
 *
 * function PlatformNode() {
 *   const { root } = useMesh('box', {
 *     size: [4, 0.5, 3],
 *     color: 0x4a6670,
 *     roughness: 0.8,
 *     castShadow: true,
 *     receiveShadow: true,
 *   });
 * }
 * ```
 *
 * @example
 * ```ts
 * import { useMesh } from '@pulse-ts/three';
 * import { useFrameUpdate } from '@pulse-ts/core';
 *
 * function CollectibleNode() {
 *   const { mesh, material } = useMesh('icosahedron', {
 *     radius: 0.25,
 *     color: 0xf4d03f,
 *     emissive: 0xf4d03f,
 *     emissiveIntensity: 0.3,
 *     castShadow: true,
 *   });
 *
 *   // Callers can still manipulate the returned objects.
 *   useFrameUpdate((dt) => {
 *     mesh.rotation.y += 2 * dt;
 *   });
 * }
 * ```
 */
export function useMesh<T extends GeometryType>(
    type: T,
    options: UseMeshOptions<T>,
): UseMeshResult {
    const root = useThreeRoot();

    const geometry = createGeometry(type, options as GeometryTypeMap[T]);

    const material = new THREE.MeshStandardMaterial({
        color: options.color,
        roughness: options.roughness,
        metalness: options.metalness,
        emissive: options.emissive,
        emissiveIntensity: options.emissiveIntensity,
        transparent: options.transparent,
        opacity: options.opacity,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = options.castShadow ?? false;
    mesh.receiveShadow = options.receiveShadow ?? false;

    useObject3D(mesh);

    return { root, mesh, material, geometry };
}
