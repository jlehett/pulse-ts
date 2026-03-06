---
paths:
  - "packages/three/**"
  - "demos/arena/src/nodes/PlatformNode.ts"
---
# DataTexture Must Use RGBAFormat (Not RGBFormat)

## The Problem

This project uses Three.js r179. `THREE.RGBFormat` (constant 1022) is deprecated and **silently broken** for `DataTexture` in modern Three.js (removed in ~r152). Textures created with `RGBFormat` and 3-byte-per-pixel data will:

- Appear to be applied (shows up in material inspector as `emissiveMap: true`)
- Have correct data in the buffer (non-zero pixels present)
- **Render as completely black** — the GPU texture upload silently fails or misinterprets the data

## The Fix

Always use `THREE.RGBAFormat` with 4-byte-per-pixel data for `DataTexture`:

```typescript
// WRONG — silently broken in r179
const data = new Uint8Array(size * size * 3);
// ... fill RGB ...
new THREE.DataTexture(data, size, size, THREE.RGBFormat);

// CORRECT
const data = new Uint8Array(size * size * 4);
// ... fill RGBA (alpha = 255) ...
new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
```

## Why It's Hard to Debug

- No console errors or warnings
- The texture object looks correct in the scene inspector (has data, correct dimensions, format field is set)
- `material.emissiveMap` reports `true`
- Even cranking `emissiveIntensity` to 5.0 produces zero visible output
- Only discoverable by checking the Three.js version and knowing about the RGBFormat deprecation

## Applies To

Any procedural `DataTexture` creation: normal maps, emissive maps, diffuse maps, etc.
