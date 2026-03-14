[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [three/src](../README.md) / CustomMeshResult

# Interface: CustomMeshResult

Defined in: packages/three/src/public/useCustomMesh.ts

Object returned by `useCustomMesh`.

## Properties

### root

> **root**: `Object3D`

The Object3D root managed by `useThreeRoot`.

### object

> **object**: `Mesh` \| `Points` \| `Line` \| `LineSegments`

The created object (Mesh, Points, Line, or LineSegments).

### material

> **material**: `Material`

The material instance created by the factory.

### geometry

> **geometry**: `BufferGeometry`

The geometry instance created by the factory.
