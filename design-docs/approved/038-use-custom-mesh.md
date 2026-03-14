# Approved: Custom Geometry Hook (`useCustomMesh`)

> Lifecycle-managed custom geometry and materials for Points, Lines, and procedural meshes.

**Origin:** Engine Improvements #38 (`useCustomMesh`).

---

## Summary

A new `useCustomMesh` hook in `@pulse-ts/three` that accepts user-provided geometry and material factory functions while handling lifecycle cleanup, shadow configuration, and scene graph management. Fills the gap between `useMesh` (predefined geometries) and raw `useObject3D` (no lifecycle help).

---

## Problem

`useMesh` only supports 9 predefined geometry types. The arena demo has 4 nodes that create custom geometry manually: StarfieldNode (Points with random positions + twinkle attributes), NebulaNode (PlaneGeometry with custom shader), EnergyPillarsNode (programmatically sized boxes). Each bypasses `useMesh` entirely, using raw `new THREE.BufferGeometry()` + `useObject3D()` — losing the convenience of automatic lifecycle cleanup, shadow config, and material setup.

---

## API

```typescript
interface CustomMeshOptions {
    /** Factory function that creates the geometry. */
    geometry: () => THREE.BufferGeometry;
    /** Factory function that creates the material. */
    material: () => THREE.Material;
    /** Object type. Default: 'mesh'. */
    type?: 'mesh' | 'points' | 'line' | 'lineSegments';
    /** Shadow options (only for 'mesh' type). */
    castShadow?: boolean;
    receiveShadow?: boolean;
}

interface CustomMeshResult {
    /** The root Object3D added to the scene. */
    root: THREE.Object3D;
    /** The created object (Mesh, Points, or Line). */
    object: THREE.Mesh | THREE.Points | THREE.Line;
    /** The material instance. */
    material: THREE.Material;
    /** The geometry instance. */
    geometry: THREE.BufferGeometry;
}

/**
 * Creates a custom geometry + material combination with full lifecycle management.
 * Geometry and material are disposed on node destroy. The object is added to and
 * removed from the scene graph automatically.
 *
 * @param options - Geometry, material, and type configuration.
 * @returns References to the created objects for runtime manipulation.
 *
 * @example
 * // Custom Points (starfield)
 * const { root, material } = useCustomMesh({
 *     geometry: () => {
 *         const geo = new THREE.BufferGeometry();
 *         const positions = new Float32Array(count * 3);
 *         // ... fill positions
 *         geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
 *         return geo;
 *     },
 *     material: () => new THREE.ShaderMaterial({
 *         vertexShader: STAR_VERT,
 *         fragmentShader: STAR_FRAG,
 *         uniforms: { uTime: { value: 0 } },
 *     }),
 *     type: 'points',
 * });
 *
 * @example
 * // Procedural mesh with shadows
 * const { root } = useCustomMesh({
 *     geometry: () => createProceduralTerrain(256, 256),
 *     material: () => new THREE.MeshStandardMaterial({ color: 0x228B22 }),
 *     castShadow: true,
 *     receiveShadow: true,
 * });
 */
function useCustomMesh(options: CustomMeshOptions): CustomMeshResult;
```

---

## Usage Examples

### Starfield (Points with custom attributes)

```typescript
const { root, material } = useCustomMesh({
    geometry: () => {
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const phases = new Float32Array(count);
        const speeds = new Float32Array(count);

        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * FIELD_RADIUS * 2;
            positions[i * 3 + 1] = Math.random() * FIELD_HEIGHT;
            positions[i * 3 + 2] = (Math.random() - 0.5) * FIELD_RADIUS * 2;
            phases[i] = Math.random() * Math.PI * 2;
            speeds[i] = 0.5 + Math.random() * 1.5;
        }

        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
        geo.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
        return geo;
    },
    material: () => new THREE.ShaderMaterial({
        vertexShader: STAR_VERT,
        fragmentShader: STAR_FRAG,
        uniforms: { uTime: { value: 0 } },
        transparent: true,
    }),
    type: 'points',
});

useFrameUpdate((dt) => {
    (material as THREE.ShaderMaterial).uniforms.uTime.value += dt;
});
```

### Nebula (Plane with custom shader)

```typescript
const { root } = useCustomMesh({
    geometry: () => new THREE.PlaneGeometry(100, 100),
    material: () => new THREE.ShaderMaterial({
        vertexShader: NEBULA_VERT,
        fragmentShader: NEBULA_FRAG,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
    }),
});
```

---

## Relationship to `useMesh`

| | `useMesh` | `useCustomMesh` |
|---|---|---|
| **Geometry** | 9 predefined types (box, sphere, cylinder, etc.) | Any `BufferGeometry` |
| **Material** | `MeshStandardMaterial` with configurable properties (#33) | Any `THREE.Material` |
| **Object type** | Always `Mesh` | `Mesh`, `Points`, `Line`, `LineSegments` |
| **Use case** | Standard shapes with PBR materials | Procedural geometry, particle systems, custom shaders |

Together with #33 (`useMesh` material extensions), these two hooks cover the full spectrum from simple primitives to fully custom geometry. Users almost never need to drop to raw `useObject3D`.

---

## Design Decisions

- **Factory functions, not instances** — `geometry` and `material` are factory functions, not pre-created instances. This makes it clear that the hook owns the lifecycle (creation and disposal).
- **Automatic disposal** — Geometry and material are disposed on node destroy. Prevents GPU memory leaks that are common with manual Three.js resource management.
- **Returns all references** — `root`, `object`, `material`, and `geometry` are all exposed for runtime manipulation (updating uniforms, modifying attributes, etc.).
- **`type` parameter** — Determines whether a `THREE.Mesh`, `THREE.Points`, or `THREE.Line` is created. Shadow options only apply to `'mesh'` type.
