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
// Material type
// ---------------------------------------------------------------------------

/**
 * Supported material types.
 *
 * - `'standard'` — `MeshStandardMaterial` (default, PBR).
 * - `'basic'` — `MeshBasicMaterial` (unlit, no lighting calculations).
 * - `'phong'` — `MeshPhongMaterial` (Blinn-Phong shading).
 */
export type MaterialType = 'standard' | 'basic' | 'phong';

// ---------------------------------------------------------------------------
// Shared option types
// ---------------------------------------------------------------------------

/**
 * Material options forwarded to the underlying Three.js material.
 *
 * All properties are optional and backward-compatible with the original
 * `MeshStandardMaterial`-only API. String enums are used for Three.js
 * constants so callers never need to import `THREE.*` values directly.
 */
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

    // -- Texture maps --

    /** Color (diffuse) texture map. */
    map?: THREE.Texture;
    /** Normal map texture. */
    normalMap?: THREE.Texture;
    /**
     * Normal map scale as `[x, y]` tuple.
     * Converted to `THREE.Vector2` internally.
     * @default [1, 1]
     */
    normalScale?: [number, number];
    /** Emissive map texture. */
    emissiveMap?: THREE.Texture;
    /** Roughness map texture. */
    roughnessMap?: THREE.Texture;
    /** Metalness map texture. */
    metalnessMap?: THREE.Texture;
    /** Alpha map texture. Controls per-pixel opacity. */
    alphaMap?: THREE.Texture;
    /** Environment map texture. */
    envMap?: THREE.Texture;

    // -- Render state --

    /**
     * Which faces to render.
     * - `'front'` — front faces only (`THREE.FrontSide`).
     * - `'back'` — back faces only (`THREE.BackSide`).
     * - `'double'` — both sides (`THREE.DoubleSide`).
     * @default 'front'
     */
    side?: 'front' | 'back' | 'double';
    /** Whether to write to the depth buffer. @default true */
    depthWrite?: boolean;
    /**
     * Blending mode.
     * - `'normal'` — `THREE.NormalBlending`.
     * - `'additive'` — `THREE.AdditiveBlending`.
     * - `'multiply'` — `THREE.MultiplyBlending`.
     * @default 'normal'
     */
    blending?: 'normal' | 'additive' | 'multiply';

    // -- Material type --

    /**
     * Which Three.js material class to use.
     * - `'standard'` — `MeshStandardMaterial` (PBR, default).
     * - `'basic'` — `MeshBasicMaterial` (unlit).
     * - `'phong'` — `MeshPhongMaterial` (Blinn-Phong).
     * @default 'standard'
     */
    materialType?: MaterialType;
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
    /** The material instance (type depends on `materialType`). */
    material: THREE.Material;
    /** The `BufferGeometry` instance. */
    geometry: THREE.BufferGeometry;
}

// ---------------------------------------------------------------------------
// String enum → Three.js constant maps
// ---------------------------------------------------------------------------

const SIDE_MAP: Record<NonNullable<MeshMaterialOptions['side']>, THREE.Side> = {
    front: THREE.FrontSide,
    back: THREE.BackSide,
    double: THREE.DoubleSide,
};

const BLENDING_MAP: Record<
    NonNullable<MeshMaterialOptions['blending']>,
    THREE.Blending
> = {
    normal: THREE.NormalBlending,
    additive: THREE.AdditiveBlending,
    multiply: THREE.MultiplyBlending,
};

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
            return new THREE.ConeGeometry(o.radius, o.height, o.radialSegments);
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
// Material factory
// ---------------------------------------------------------------------------

/**
 * Builds the shared material parameter object from user-facing options,
 * mapping string enums to Three.js constants.
 */
function buildMaterialParams(
    opts: MeshMaterialOptions,
): Record<string, unknown> {
    const params: Record<string, unknown> = {
        color: opts.color,
        roughness: opts.roughness,
        metalness: opts.metalness,
        emissive: opts.emissive,
        emissiveIntensity: opts.emissiveIntensity,
        transparent: opts.transparent,
        opacity: opts.opacity,
        map: opts.map,
        normalMap: opts.normalMap,
        emissiveMap: opts.emissiveMap,
        roughnessMap: opts.roughnessMap,
        metalnessMap: opts.metalnessMap,
        alphaMap: opts.alphaMap,
        envMap: opts.envMap,
    };

    if (opts.normalScale !== undefined) {
        params.normalScale = new THREE.Vector2(
            opts.normalScale[0],
            opts.normalScale[1],
        );
    }

    if (opts.side !== undefined) {
        params.side = SIDE_MAP[opts.side];
    }

    if (opts.depthWrite !== undefined) {
        params.depthWrite = opts.depthWrite;
    }

    if (opts.blending !== undefined) {
        params.blending = BLENDING_MAP[opts.blending];
    }

    return params;
}

/**
 * Creates a Three.js material based on the `materialType` option.
 *
 * @param opts - Material options including the `materialType` discriminator.
 * @returns A Three.js material instance.
 */
function createMaterial(opts: MeshMaterialOptions): THREE.Material {
    const params = buildMaterialParams(opts);
    const type = opts.materialType ?? 'standard';

    switch (type) {
        case 'basic':
            return new THREE.MeshBasicMaterial(
                params as THREE.MeshBasicMaterialParameters,
            );
        case 'phong':
            return new THREE.MeshPhongMaterial(
                params as THREE.MeshPhongMaterialParameters,
            );
        case 'standard':
        default:
            return new THREE.MeshStandardMaterial(
                params as THREE.MeshStandardMaterialParameters,
            );
    }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Creates a `THREE.Mesh` with the specified geometry, material, and shadow
 * settings, and attaches it to the current node's Three.js root.
 *
 * Combines `useThreeRoot()`, geometry creation, material setup,
 * shadow configuration, and `useObject3D()` into a single declarative call.
 * Returns all internals so callers can still modify them after creation
 * (e.g. animating emissive intensity or reading `mesh.rotation`).
 *
 * Supports multiple material types via `materialType`:
 * - `'standard'` (default) — PBR material (`MeshStandardMaterial`)
 * - `'basic'` — unlit material (`MeshBasicMaterial`)
 * - `'phong'` — Blinn-Phong shading (`MeshPhongMaterial`)
 *
 * String enums are used for Three.js constants so callers never need to
 * import `THREE.*` values directly:
 * - `side`: `'front'` | `'back'` | `'double'`
 * - `blending`: `'normal'` | `'additive'` | `'multiply'`
 * - `normalScale`: `[number, number]` tuple instead of `THREE.Vector2`
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
 * // Using texture maps and render state
 * import { useMesh } from '@pulse-ts/three';
 *
 * function GlassPanel() {
 *   const { mesh } = useMesh('plane', {
 *     width: 2,
 *     height: 3,
 *     color: 0xffffff,
 *     transparent: true,
 *     opacity: 0.3,
 *     side: 'double',
 *     depthWrite: false,
 *     blending: 'normal',
 *   });
 * }
 * ```
 *
 * @example
 * ```ts
 * // Using an alternative material type
 * import { useMesh } from '@pulse-ts/three';
 *
 * function UnlitMarker() {
 *   const { mesh } = useMesh('sphere', {
 *     radius: 0.1,
 *     color: 0xff0000,
 *     materialType: 'basic',
 *   });
 * }
 * ```
 *
 * @example
 * ```ts
 * // Applying texture maps with normalScale
 * import { useMesh } from '@pulse-ts/three';
 * import * as THREE from 'three';
 *
 * function TexturedWall(diffuse: THREE.Texture, normal: THREE.Texture) {
 *   const { mesh } = useMesh('box', {
 *     size: [4, 3, 0.2],
 *     map: diffuse,
 *     normalMap: normal,
 *     normalScale: [1, 1],
 *     roughness: 0.9,
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
    const material = createMaterial(options);

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = options.castShadow ?? false;
    mesh.receiveShadow = options.receiveShadow ?? false;

    useObject3D(mesh);

    return { root, mesh, material, geometry };
}
