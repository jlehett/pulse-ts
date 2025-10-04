[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [three/src](../README.md) / useThreeContext

# Function: useThreeContext()

> **useThreeContext**(): `object`

Defined in: [packages/three/src/public/hooks.ts:22](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/three/src/public/hooks.ts#L22)

Returns Three.js context bound to the current `World`.

- Throws if the `ThreeService` is not provided to the world.
- Provides access to the shared renderer, scene, and camera.

## Returns

`object`

The service and core Three objects { service, renderer, scene, camera }.

### camera

> **camera**: `Camera`

### renderer

> **renderer**: `WebGLRenderer`

### scene

> **scene**: `Scene`

### service

> **service**: [`ThreeService`](../classes/ThreeService.md)

## Example

```ts
import { useThreeContext } from '@pulse-ts/three';
function ReadCamera() {
  const { camera } = useThreeContext();
  // read camera each frame
}
```
