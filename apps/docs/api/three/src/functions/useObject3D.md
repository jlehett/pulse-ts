[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [three/src](../README.md) / useObject3D

# Function: useObject3D()

> **useObject3D**(`object`): `void`

Defined in: [packages/three/src/public/hooks.ts:83](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/three/src/public/hooks.ts#L83)

Attaches an `Object3D` to the current component's root for the lifetime of the component.

- The object is added as a child of the component's root.
- On component destroy, the object is removed.

## Parameters

### object

`Object3D`

The `THREE.Object3D` to attach.

## Returns

`void`

## Example

```ts
import * as THREE from 'three';
import { useObject3D } from '@pulse-ts/three';
function Helpers() {
  useObject3D(new THREE.AxesHelper(2));
}
```
