[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [three/src](../README.md) / useScreenProjection

# Function: useScreenProjection()

> **useScreenProjection**(): (`position`: [`WorldPoint`](../interfaces/WorldPoint.md)) => [`ScreenPoint`](../interfaces/ScreenPoint.md)

Defined in: packages/three/src/public/useScreenProjection.ts

Returns a projection function that converts world-space positions to
screen-space pixel coordinates.

Uses the active Three.js camera and renderer dimensions. Reuses an
internal `Vector3` so no allocations occur per call. The returned
`ScreenPoint` object is also reused — callers should consume values
immediately rather than storing across frames.

## Returns

A function that projects a `WorldPoint` to a `ScreenPoint`.

## Examples

```ts
import { useScreenProjection } from '@pulse-ts/three';
import { useFrameUpdate } from '@pulse-ts/core';

function HealthBarNode() {
  const project = useScreenProjection();

  useFrameUpdate(() => {
    const { x, y, visible } = project(root.position);
    if (visible) {
      indicator.style.left = `${x}px`;
      indicator.style.top = `${y}px`;
    }
  });
}
```

```ts
// Computing a screen-space radius from a world-space offset
const project = useScreenProjection();

useFrameUpdate(() => {
  const center = project(root.position);
  const edge = project({
    x: root.position.x + RADIUS,
    y: root.position.y,
    z: root.position.z,
  });
  const screenRadius = Math.abs(edge.x - center.x);
});
```
