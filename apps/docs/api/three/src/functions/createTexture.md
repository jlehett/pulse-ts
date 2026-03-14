[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [three/src](../README.md) / createTexture

# Function: createTexture()

> **createTexture**(`size`: `number`, `rasterize`: [`PixelFn`](../type-aliases/PixelFn.md), `options?`: [`TextureOptions`](../interfaces/TextureOptions.md)): `THREE.DataTexture`

Defined in: packages/three/src/public/createTexture.ts

Create a procedural square `DataTexture` by rasterizing a per-pixel function.
Handles buffer allocation, DataTexture creation, and filter/wrap setup.

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `size` | `number` | Texture width and height in pixels (square). |
| `rasterize` | [`PixelFn`](../type-aliases/PixelFn.md) | Called for each pixel; returns `[R, G, B, A]` (0–255). |
| `options?` | [`TextureOptions`](../interfaces/TextureOptions.md) | Wrap mode, filter mode, and format. |

## Returns

A ready-to-use `DataTexture` with `needsUpdate` already set.

## Examples

```ts
import { createTexture } from '@pulse-ts/three';

const normalMap = createTexture(256, (x, y, size) => {
    const cx = (x / size - 0.5) * 2;
    const cy = (y / size - 0.5) * 2;
    return [cx * 127 + 128, cy * 127 + 128, 255, 255];
}, { wrap: 'repeat', filter: 'linear' });
```

```ts
import { createTexture } from '@pulse-ts/three';

const emissiveMap = createTexture(256, (x, y, size) => {
    const spacing = 32;
    const onLine = x % spacing <= 1 || y % spacing <= 1;
    return onLine ? [50, 180, 220, 255] : [0, 0, 0, 255];
}, { wrap: 'repeat', filter: 'linear' });
```
