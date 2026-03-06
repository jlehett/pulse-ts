---
paths:
  - "demos/arena/src/nodes/PlatformNode.ts"
---
# Platform Shader Patches for Grid Effects

## Pattern

The PlatformNode uses `onBeforeCompile` to patch the MeshStandardMaterial's fragment shader for effects that modulate the grid visual (e.g., ripples). **Do not create overlay meshes** for grid effects — instead, patch the material's emissive pipeline to only affect grid lines.

## Why This Approach

The grid lines are defined by a `gridEmissiveMap` DataTexture. Effects must work within the same material's emissive channel to:
- Only brighten existing grid lines (not create visible solid shapes)
- Avoid z-fighting or overdraw issues
- Keep the platform as a single mesh

## Implementation Steps

### 1. Add Custom Uniforms

```typescript
const shader = material.onBeforeCompile = (shader) => {
  shader.uniforms.myEffectIntensity = { value: 1.0 };
  shader.uniforms.myEffectTime = { value: 0.0 };
  // ... other uniforms
};
```

### 2. Inject Uniform Declarations

Replace the `#include <common>` directive to add uniform declarations:

```typescript
shader.fragmentShader = shader.fragmentShader.replace(
  '#include <common>',
  `#include <common>
   uniform float myEffectIntensity;
   uniform float myEffectTime;`
);
```

### 3. Modulate Emissive Output

Replace the `#include <emissivemap_fragment>` directive. At this point in the shader, `totalEmissiveRadiance` already contains the applied emissive map (grid lines). Append code that reads and modulates it:

```typescript
shader.fragmentShader = shader.fragmentShader.replace(
  '#include <emissivemap_fragment>',
  `#include <emissivemap_fragment>
   // totalEmissiveRadiance now contains grid lines (emissive map applied)
   // Modulate based on effect (ripples, waves, etc.)
   vec3 effect = computeEffect(vEmissiveMapUv, myEffectTime, myEffectIntensity);
   totalEmissiveRadiance += effect;`
);
```

**Key:** `totalEmissiveRadiance` is **zero where there are no grid lines** (fill areas), so modulation only affects the grid.

### 4. UV Coordinates for Grid

**IMPORTANT (Three.js r179+):** Do NOT use `vUv` — it is only defined when `USE_UV` is set (requires a base `map` on the material). Materials that only use specialized maps (emissiveMap, normalMap, etc.) must use the map-specific UV varying: `vEmissiveMapUv`, `vNormalMapUv`, etc. Using `vUv` causes a silent shader compilation failure and the material renders black/invisible.

On the cylinder's top cap, use `vEmissiveMapUv` to compute positions relative to the grid:

```glsl
// Radial distance from center (0 at center, 1 at edge)
float radialDist = length(vEmissiveMapUv - vec2(0.5)) * 2.0;

// Angle around center
float angle = atan(vEmissiveMapUv.y - 0.5, vEmissiveMapUv.x - 0.5);
```

Grid line spacing follows the hexagonal/square layout — scale `radialDist` and angle by the grid period to detect line proximity.

## Anti-Pattern

**Do not:**
- Create a separate overlay mesh to render grid effects (causes z-fighting)
- Write directly to `gl_FragColor` (overwrites the entire surface)
- Assume the emissive map is always applied before your effect (always call `#include <emissivemap_fragment>` first)

## Update Loop

Update uniforms every frame or when parameters change:

```typescript
shader.uniforms.myEffectTime.value += deltaTime;
shader.uniforms.myEffectIntensity.value = someParameter;
```

## Related Files

- `packages/three/src/domain/systems/trsSync.ts` — Material lifecycle management
- `demos/arena/src/nodes/PlatformNode.ts` — PlatformNode implementation
