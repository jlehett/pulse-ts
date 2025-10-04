[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [three/src](../README.md) / useThreeRoot

# Function: useThreeRoot()

> **useThreeRoot**(): `Object3D`

Defined in: [packages/three/src/public/hooks.ts:56](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/three/src/public/hooks.ts#L56)

Ensures and returns the `Object3D` root associated with the current component's `Node`.

- The root is kept parented to the `Object3D` of the parent `Node`, or the scene.
- On component destroy, the root is disposed and removed from the scene graph.

## Returns

`Object3D`

The `Object3D` root for the current `Node`.

## Example

```ts
import { useThreeRoot } from '@pulse-ts/three';
function WithRoot() {
  const root = useThreeRoot();
  root.position.set(0, 1, 0);
}
```
