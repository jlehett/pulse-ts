# Procedural Textures

`createTexture` and `createTexture1D` generate `THREE.DataTexture` instances from
per-pixel rasterization callbacks. They handle buffer allocation, texture creation,
and wrap/filter setup so you can focus on the pixel logic.

## Overview

| Function | Purpose |
|---|---|
| `createTexture(size, rasterize, options?)` | Square texture (size × size) |
| `createTexture1D(width, rasterize, options?)` | 1D texture (width × 1) for gradients |

Both are pure utility functions exported from `@pulse-ts/three`.

## Quick Start

```ts
import { createTexture, createTexture1D } from '@pulse-ts/three';

// Grid emissive map
const emissiveMap = createTexture(256, (x, y) => {
    const spacing = 32;
    const onLine = x % spacing <= 1 || y % spacing <= 1;
    return onLine ? [50, 180, 220, 255] : [0, 0, 0, 255];
}, { wrap: 'repeat', filter: 'linear' });

// Gradient ramp
const gradient = createTexture1D(64, (x, width) => {
    const t = x / width;
    return [255 * t, 100, 255 * (1 - t), 255];
});
```

## Pixel Callback

The rasterize function is called once per pixel and must return an `[R, G, B, A]`
tuple with values in the 0–255 range.

**2D callback:** `(x, y, size) => [R, G, B, A]`

**1D callback:** `(x, width) => [R, G, B, A]`

## Options

| Option | Values | Default | Description |
|---|---|---|---|
| `wrap` | `'repeat'` \| `'clamp'` \| `'mirror'` | `'clamp'` | Wrap mode for both S and T axes |
| `filter` | `'linear'` \| `'nearest'` | `'linear'` | Min and mag filter mode |
| `format` | `'rgba'` \| `'rgb'` | `'rgba'` | Pixel format (3 or 4 channels) |

String values are mapped to Three.js constants automatically:

- `'repeat'` → `THREE.RepeatWrapping`
- `'clamp'` → `THREE.ClaimToEdgeWrapping`
- `'mirror'` → `THREE.MirroredRepeatWrapping`
- `'linear'` → `THREE.LinearFilter`
- `'nearest'` → `THREE.NearestFilter`

## Examples

### Normal Map

```ts
const normalMap = createTexture(256, (x, y, size) => {
    const cx = (x / size - 0.5) * 2;
    const cy = (y / size - 0.5) * 2;
    return [cx * 127 + 128, cy * 127 + 128, 255, 255];
}, { wrap: 'repeat', filter: 'linear' });
```

### RGB Format (No Alpha)

```ts
const rgbTexture = createTexture(128, (x, y) => {
    return [x * 2, y * 2, 128, 0]; // alpha ignored in rgb mode
}, { format: 'rgb' });
```

## Limitations

- Textures are generated synchronously on the CPU. For very large textures
  (1024+), consider generating them off the main thread.
- The callback is invoked once during creation. For animated textures,
  regenerate the texture each frame or manipulate the buffer directly.
