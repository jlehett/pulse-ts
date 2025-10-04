[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [three/src](../README.md) / useThreeContext

# Function: useThreeContext()

> **useThreeContext**(): `object`

Defined in: [packages/three/src/fc/hooks.ts:13](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/three/src/fc/hooks.ts#L13)

Returns Three.js context bound to the current `World`.

- Throws if the `ThreeService` is not provided to the world.
- Provides access to the shared renderer, scene, and camera.

## Returns

`object`

The plugin and core Three objects.

### camera

> **camera**: `Camera`

### renderer

> **renderer**: `WebGLRenderer`

### scene

> **scene**: `Scene`

### service

> **service**: [`ThreeService`](../classes/ThreeService.md)
