[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [three/src](../README.md) / useInterpolatedPosition

# Function: useInterpolatedPosition()

> **useInterpolatedPosition**(`source`: `Transform`, `target`: `Object3D`, `options?`: [`InterpolatedPositionOptions`](../interfaces/InterpolatedPositionOptions.md)): `void`

Defined in: packages/three/src/public/useInterpolatedPosition.ts

Smoothly interpolates a Three.js `Object3D` position from a `Transform`
component across fixed-step boundaries. Snapshots the transform each
fixed tick and applies alpha-blended interpolation each render frame.

Eliminates the most common fixed-to-frame interpolation boilerplate —
a single call replaces ~15 lines of manual `useFixedEarly` +
`useFrameUpdate` interpolation code.

## Parameters

### source

> `Transform`

The ECS `Transform` component (updated in fixed step).

### target

> `Object3D`

The Three.js `Object3D` whose position is driven.

### options?

> [`InterpolatedPositionOptions`](../interfaces/InterpolatedPositionOptions.md)

Optional configuration for alpha source and snap behavior.

## Returns

`void`

## Examples

```ts
import { useComponent, Transform } from '@pulse-ts/core';
import { useMesh, useInterpolatedPosition } from '@pulse-ts/three';

function LocalPlayerNode() {
  const transform = useComponent(Transform);
  const { root } = useMesh('sphere', { radius: 0.5 });

  // One line replaces 15 lines of manual interpolation
  useInterpolatedPosition(transform, root);
}
```

```ts
// With snap override (e.g., teleport on round reset)
let shouldSnap = false;

useInterpolatedPosition(transform, root, {
  snap: () => {
    if (shouldSnap) { shouldSnap = false; return true; }
    return false;
  },
});
```
