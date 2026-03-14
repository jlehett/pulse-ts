[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [three/src](../README.md) / useMesh

# Function: useMesh()

> **useMesh**\<`T`\>(`type`: `T`, `options`: `UseMeshOptions<T>`): `UseMeshResult`

Defined in: packages/three/src/public/useMesh.ts

Creates a `THREE.Mesh` with the specified geometry, material, and shadow
settings, and attaches it to the current node's Three.js root.

Combines `useThreeRoot()`, geometry creation, material setup, shadow
configuration, and `useObject3D()` into a single declarative call.
Returns all internals so callers can still modify them after creation.

## Type Parameters

### T

> `T` *extends* `GeometryType`

The geometry type string (e.g. `'box'`, `'sphere'`, `'capsule'`).

## Parameters

### type

> `T`

The geometry type to create.

### options

> `UseMeshOptions<T>`

Geometry dimensions, material properties, shadow flags, texture maps,
render state, and material type selection. All material options are optional.

## Returns

`UseMeshResult` — An object containing `{ root, mesh, material, geometry }`.

## Material Types

The `materialType` option selects which Three.js material class to use:

- `'standard'` (default) — `MeshStandardMaterial` (PBR)
- `'basic'` — `MeshBasicMaterial` (unlit, no lighting calculations)
- `'phong'` — `MeshPhongMaterial` (Blinn-Phong shading)

## Texture Maps

Texture maps can be applied via options: `map`, `normalMap`, `emissiveMap`,
`roughnessMap`, `metalnessMap`, `alphaMap`, `envMap`. The `normalScale`
option accepts a `[number, number]` tuple (converted to `THREE.Vector2`
internally).

## Render State

String enums are used for Three.js constants:

- `side`: `'front'` | `'back'` | `'double'`
- `blending`: `'normal'` | `'additive'` | `'multiply'`
- `depthWrite`: `boolean`

## Examples

```ts
import { useMesh } from '@pulse-ts/three';

function PlatformNode() {
  const { root } = useMesh('box', {
    size: [4, 0.5, 3],
    color: 0x4a6670,
    roughness: 0.8,
    castShadow: true,
    receiveShadow: true,
  });
}
```

```ts
// Using render state options
import { useMesh } from '@pulse-ts/three';

function GlassPanel() {
  const { mesh } = useMesh('plane', {
    width: 2,
    height: 3,
    color: 0xffffff,
    transparent: true,
    opacity: 0.3,
    side: 'double',
    depthWrite: false,
    blending: 'normal',
  });
}
```

```ts
// Using an alternative material type
import { useMesh } from '@pulse-ts/three';

function UnlitMarker() {
  const { mesh } = useMesh('sphere', {
    radius: 0.1,
    color: 0xff0000,
    materialType: 'basic',
  });
}
```

```ts
// Applying texture maps with normalScale
import { useMesh } from '@pulse-ts/three';
import * as THREE from 'three';

function TexturedWall(diffuse: THREE.Texture, normal: THREE.Texture) {
  const { mesh } = useMesh('box', {
    size: [4, 3, 0.2],
    map: diffuse,
    normalMap: normal,
    normalScale: [1, 1],
    roughness: 0.9,
  });
}
```
