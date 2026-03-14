[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [three/src](../README.md) / createTexture1D

# Function: createTexture1D()

> **createTexture1D**(`width`: `number`, `rasterize`: [`PixelFn1D`](../type-aliases/PixelFn1D.md), `options?`: [`TextureOptions`](../interfaces/TextureOptions.md)): `THREE.DataTexture`

Defined in: packages/three/src/public/createTexture.ts

Create a 1D procedural `DataTexture` (height = 1) by rasterizing a per-pixel function.
Useful for gradient textures and color ramps.

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `width` | `number` | Texture width in pixels. |
| `rasterize` | [`PixelFn1D`](../type-aliases/PixelFn1D.md) | Called for each pixel; returns `[R, G, B, A]` (0–255). |
| `options?` | [`TextureOptions`](../interfaces/TextureOptions.md) | Wrap mode, filter mode, and format. |

## Returns

A 1-pixel-tall `DataTexture` with `needsUpdate` already set.

## Example

```ts
import { createTexture1D } from '@pulse-ts/three';

const gradient = createTexture1D(64, (x, width) => {
    const t = x / width;
    return [255 * t, 100, 255 * (1 - t), 255];
});
```
