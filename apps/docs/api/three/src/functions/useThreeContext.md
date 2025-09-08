[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [three/src](../README.md) / useThreeContext

# Function: useThreeContext()

> **useThreeContext**(): `object`

Defined in: [three/src/fc/hooks.ts:13](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/three/src/fc/hooks.ts#L13)

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
