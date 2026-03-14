[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [three/src](../README.md) / useCustomMesh

# Function: useCustomMesh()

> **useCustomMesh**(`options`): [`CustomMeshResult`](../interfaces/CustomMeshResult.md)

Defined in: packages/three/src/public/useCustomMesh.ts

Creates a custom geometry + material combination with full lifecycle management.

Geometry and material are created from the provided factory functions and
disposed automatically when the node is destroyed. The resulting object is
added to and removed from the scene graph via `useThreeRoot` / `useObject3D`.

## Parameters

### options

[`CustomMeshOptions`](../interfaces/CustomMeshOptions.md)

Geometry factory, material factory, object type, and shadow flags.

## Returns

[`CustomMeshResult`](../interfaces/CustomMeshResult.md)

References to the created `{ root, object, material, geometry }`.

## Examples

```ts
import * as THREE from 'three';
import { useCustomMesh } from '@pulse-ts/three';

// Custom Points (starfield)
function StarfieldNode() {
  const { root, material } = useCustomMesh({
    geometry: () => {
      const geo = new THREE.BufferGeometry();
      const positions = new Float32Array(1000 * 3);
      // ... fill positions
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      return geo;
    },
    material: () => new THREE.PointsMaterial({ size: 0.1 }),
    type: 'points',
  });
}
```

```ts
import * as THREE from 'three';
import { useCustomMesh } from '@pulse-ts/three';

// Procedural mesh with shadows
function TerrainNode() {
  const { root } = useCustomMesh({
    geometry: () => new THREE.PlaneGeometry(100, 100, 64, 64),
    material: () => new THREE.MeshStandardMaterial({ color: 0x228b22 }),
    castShadow: true,
    receiveShadow: true,
  });
}
```
