[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [three/src](../README.md) / useThreeRoot

# Function: useThreeRoot()

> **useThreeRoot**(): `Object3D`

Defined in: [three/src/fc/hooks.ts:38](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/three/src/fc/hooks.ts#L38)

Ensures and returns the `Object3D` root associated with the current component's `Node`.

- The root is kept parented to the `Object3D` of the parent `Node`, or the scene.
- On component destroy, the root is disposed and removed from the scene graph.

## Returns

`Object3D`

The `Object3D` root for the current `Node`.
