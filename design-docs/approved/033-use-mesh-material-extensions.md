# Approved: `useMesh` Material Extensions

> Extend `useMesh` to support texture maps, render state options, and alternative material types.

**Origin:** Engine Improvements #33 (`useMesh` Material Extensions).

---

## Summary

Enhance the existing `useMesh` hook in `@pulse-ts/three` to support the full range of `MeshStandardMaterial` properties — texture maps, render state, and alternative material types. Eliminates the need to bypass `useMesh` for textured or non-standard materials.

---

## Problem

`useMesh` only exposes 7 `MeshStandardMaterial` properties: `color`, `roughness`, `metalness`, `emissive`, `emissiveIntensity`, `transparent`, `opacity`. Any game that needs textured surfaces, double-sided rendering, additive blending, or alternative material types must bypass `useMesh` entirely, losing its lifecycle management, shadow configuration, and convenience. PlatformNode has 40+ lines of manual material setup just to use `emissiveMap` and `normalMap`.

---

## New Material Options

```typescript
interface MeshMaterialOptions {
    // Existing:
    color?: number;
    roughness?: number;
    metalness?: number;
    emissive?: number;
    emissiveIntensity?: number;
    transparent?: boolean;
    opacity?: number;

    // New — texture maps:
    map?: THREE.Texture;
    normalMap?: THREE.Texture;
    normalScale?: [number, number];
    emissiveMap?: THREE.Texture;
    roughnessMap?: THREE.Texture;
    metalnessMap?: THREE.Texture;
    alphaMap?: THREE.Texture;
    envMap?: THREE.Texture;

    // New — render state:
    side?: 'front' | 'back' | 'double';
    depthWrite?: boolean;
    blending?: 'normal' | 'additive' | 'multiply';

    // New — material type:
    materialType?: 'standard' | 'basic' | 'phong';
}
```

---

## Usage Examples

### Before — bypassing useMesh for textures

```typescript
const platformGeometry = new THREE.CylinderGeometry(PLATFORM_RADIUS, ...);
const platformMat = new THREE.MeshStandardMaterial({
    color: PLATFORM_COLOR,
    roughness: 0.65,
    metalness: 0.2,
    emissive: GRID_EMISSIVE_COLOR,
    emissiveIntensity: GRID_EMISSIVE_INTENSITY,
    emissiveMap: gridEmissiveMap,
    normalMap: gridNormalMap,
    normalScale: new THREE.Vector2(0.3, 0.3),
});
const platformMesh = new THREE.Mesh(platformGeometry, platformMat);
useObject3D(platformMesh);
```

### After — useMesh handles everything

```typescript
const { root, material } = useMesh('cylinder', {
    radiusTop: PLATFORM_RADIUS,
    radiusBottom: PLATFORM_RADIUS,
    height: PLATFORM_HEIGHT,
    color: PLATFORM_COLOR,
    roughness: 0.65,
    metalness: 0.2,
    emissive: GRID_EMISSIVE_COLOR,
    emissiveIntensity: GRID_EMISSIVE_INTENSITY,
    emissiveMap: gridEmissiveMap,
    normalMap: gridNormalMap,
    normalScale: [0.3, 0.3],
    receiveShadow: true,
});
```

### Additive blending particle mesh

```typescript
const { root } = useMesh('plane', {
    materialType: 'basic',
    map: glowTexture,
    transparent: true,
    blending: 'additive',
    depthWrite: false,
    side: 'double',
});
```

---

## Design Decisions

- **Enhancement, not a new hook** — Extends the existing `useMesh` API. All current usages continue to work unchanged.
- **String enums for Three.js constants** — `side: 'double'` instead of `side: THREE.DoubleSide`. Keeps the API readable and avoids requiring users to import Three.js constants.
- **`normalScale` as tuple** — `[number, number]` instead of `THREE.Vector2`. Consistent with pulse-ts's pattern of using plain data at API boundaries.
- **`materialType` defaults to `'standard'`** — Backward compatible. `'basic'` and `'phong'` are available for cases where PBR is unnecessary (particles, unlit overlays, performance-sensitive mobile rendering).
