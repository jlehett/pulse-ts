---
paths:
  - "demos/arena/src/nodes/PlatformNode.ts"
  - "demos/arena/src/nodes/EnergyPillarsNode.ts"
---
# Three.js Material Patterns for Arena

## Emissive-Only Materials for Uniform Glow

When creating objects that should glow uniformly regardless of scene lighting (e.g., energy pillars), use emissive-only rendering:

- Set diffuse `color` to `0x000000` (black)
- Apply all visual output via `emissive` + `emissiveIntensity`

**Why:** Without this pattern, nearby point lights or directional lights will create uneven illumination across instances. Some pillars appear brighter than others depending on their position relative to lights, breaking the uniform visual effect.

**Example:**
```typescript
const material = new MeshStandardMaterial({
  color: 0x000000,
  emissive: 0x00ff00,
  emissiveIntensity: 1.0,
});
```

## Surface Patterns on Overhead-Viewed Platforms

Normal maps perturb lighting reflections but are **invisible from directly overhead** (the arena's camera angle). To make surface patterns (hex grids, tiles) visible from above:

### Requirements

1. **Emissive Map** (not normal map):
   - Texture edge pixels must be bright enough (RGB > 200) to be visible against ambient/diffuse wash-out
   - Apply via `material.emissiveMap = texture`

2. **UV Tiling for Pattern Density**:
   - Set pattern repetition: `texture.repeat.set(N, N)` where N is the tile count per unit
   - Ensures the pattern is dense enough to read from overhead viewpoint

3. **Brightness**:
   - `emissiveIntensity >= 0.8` to overcome ambient/diffuse lighting and make the pattern stand out

**Example:**
```typescript
const patternTexture = new TextureLoader().load('hex-grid.png');
patternTexture.repeat.set(8, 8); // 8x8 tiles across the platform

const platformMaterial = new MeshStandardMaterial({
  color: 0x333333,
  emissiveMap: patternTexture,
  emissive: 0xffffff,
  emissiveIntensity: 0.8,
});
```

### Anti-Pattern

Using `normalMap` alone to define surface structure — normal maps work by perturbing reflections, which are invisible when the camera is perpendicular to the surface (overhead view).
