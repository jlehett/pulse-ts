[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [three/src](../README.md) / CustomMeshOptions

# Interface: CustomMeshOptions

Defined in: packages/three/src/public/useCustomMesh.ts

Configuration for `useCustomMesh`.

## Properties

### geometry

> **geometry**: () => `BufferGeometry`

Factory function that creates the geometry. The hook owns disposal.

### material

> **material**: () => `Material`

Factory function that creates the material. The hook owns disposal.

### type?

> `optional` **type**: `'mesh'` \| `'points'` \| `'line'` \| `'lineSegments'`

The type of Three.js object to create.

#### Default Value

`'mesh'`

### castShadow?

> `optional` **castShadow**: `boolean`

Whether the object casts shadows. Only applies when `type` is `'mesh'`.

#### Default Value

`false`

### receiveShadow?

> `optional` **receiveShadow**: `boolean`

Whether the object receives shadows. Only applies when `type` is `'mesh'`.

#### Default Value

`false`
