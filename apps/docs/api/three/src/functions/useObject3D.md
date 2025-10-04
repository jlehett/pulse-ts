[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [three/src](../README.md) / useObject3D

# Function: useObject3D()

> **useObject3D**(`object`): `void`

Defined in: [packages/three/src/fc/hooks.ts:56](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/three/src/fc/hooks.ts#L56)

Attaches an `Object3D` to the current component's root for the lifetime of the component.

- The object is added as a child of the component's root.
- On component destroy, the object is removed.

## Parameters

### object

`Object3D`

The `THREE.Object3D` to attach.

## Returns

`void`
