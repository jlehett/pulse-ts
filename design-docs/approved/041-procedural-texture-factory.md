# Approved: Procedural Texture Factory (`createTexture`)

> Per-pixel rasterization callback for generating `DataTexture` instances with automatic buffer and wrap/filter setup.

**Origin:** Engine Improvements #41 (`createTexture`).

---

## Summary

A `createTexture` utility in `@pulse-ts/three` that creates `THREE.DataTexture` from a per-pixel callback function. Handles buffer allocation, DataTexture creation, and wrap/filter configuration. Includes a 1D variant for gradient textures.

---

## Problem

`PlatformNode` has 5 procedural texture functions, each with identical boilerplate: allocate a `Uint8Array`, loop over pixels, create a `DataTexture`, set wrap/filter modes. The actual per-pixel logic is 1–3 lines, but the surrounding buffer management is 10+ lines per texture. Any game with procedural textures (normal maps, emissive grids, noise textures) duplicates this pattern.

---

## API

```typescript
/** Per-pixel rasterization callback. Returns [R, G, B, A] (0–255). */
type PixelFn = (x: number, y: number, size: number) => [number, number, number, number];

interface TextureOptions {
    wrap?: 'repeat' | 'clamp' | 'mirror';
    filter?: 'linear' | 'nearest';
    format?: 'rgba' | 'rgb';
}

/**
 * Create a procedural DataTexture by rasterizing a per-pixel function.
 * Handles buffer allocation, DataTexture creation, and filter/wrap setup.
 *
 * @param size - Texture width and height in pixels (square).
 * @param rasterize - Called for each pixel; returns [R, G, B, A] (0–255).
 * @param options - Wrap mode, filter mode, and format.
 * @returns A ready-to-use DataTexture.
 *
 * @example
 * const normalMap = createTexture(256, (x, y, size) => {
 *     const cx = (x / size - 0.5) * 2;
 *     const cy = (y / size - 0.5) * 2;
 *     return [cx * 127 + 128, cy * 127 + 128, 255, 255];
 * }, { wrap: 'repeat', filter: 'linear' });
 *
 * @example
 * const emissiveMap = createTexture(256, (x, y, size) => {
 *     const spacing = 32;
 *     const onLine = x % spacing <= 1 || y % spacing <= 1;
 *     return onLine ? [50, 180, 220, 255] : [0, 0, 0, 255];
 * }, { wrap: 'repeat', filter: 'linear' });
 */
function createTexture(size: number, rasterize: PixelFn, options?: TextureOptions): THREE.DataTexture;

/**
 * 1D variant for gradient textures (height = 1).
 *
 * @param width - Texture width in pixels.
 * @param rasterize - Called for each pixel; returns [R, G, B, A] (0–255).
 * @param options - Wrap mode, filter mode, and format.
 * @returns A 1×width DataTexture.
 *
 * @example
 * const gradient = createTexture1D(64, (x, width) => {
 *     const t = x / width;
 *     return [255 * t, 100, 255 * (1 - t), 255];
 * });
 */
function createTexture1D(
    width: number,
    rasterize: (x: number, width: number) => [number, number, number, number],
    options?: TextureOptions,
): THREE.DataTexture;
```

---

## Usage Examples

### Before — manual buffer management

```typescript
function createGridEmissiveMap(size: number): THREE.DataTexture {
    const data = new Uint8Array(size * size * 4);
    const spacing = 32;
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const i = (y * size + x) * 4;
            const onLine = x % spacing <= 1 || y % spacing <= 1;
            data[i] = onLine ? 50 : 0;
            data[i + 1] = onLine ? 180 : 0;
            data[i + 2] = onLine ? 220 : 0;
            data[i + 3] = 255;
        }
    }
    const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.minFilter = tex.magFilter = THREE.LinearFilter;
    tex.needsUpdate = true;
    return tex;
}
```

### After — one-liner

```typescript
const emissiveMap = createTexture(256, (x, y) => {
    const spacing = 32;
    const onLine = x % spacing <= 1 || y % spacing <= 1;
    return onLine ? [50, 180, 220, 255] : [0, 0, 0, 255];
}, { wrap: 'repeat', filter: 'linear' });
```

---

## Design Decisions

- **Callback returns `[R, G, B, A]` tuple** — Clear, simple contract. No need to manually compute buffer offsets.
- **String enums for Three.js constants** — `'repeat'` instead of `THREE.RepeatWrapping`. Consistent with `useMesh` material options (#33).
- **Square textures by default** — Single `size` parameter. Most procedural textures are square. The 1D variant covers the gradient case.
- **`createTexture1D` as separate function** — Different callback signature (no `y`), clearer intent than `createTexture(width, 1, ...)`.
