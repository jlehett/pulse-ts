# Bloom + ACES Tonemapping Interaction

**Paths:** `demos/arena/src/setupPostProcessing.ts`, `demos/arena/src/nodes/**/*.ts`

## The Problem

The post-processing pipeline applies `THREE.ACESFilmicToneMapping` at the renderer level (line 30 in `setupPostProcessing.ts`). ACES compression remaps HDR values into [0, 1] range in each material's fragment shader **before** pixels reach the bloom pass render target.

Example: a bright emissive material with color `[10, 10, 10]` (10x HDR boost):
- With `toneMapped: true` (default), ACES compresses it to ~`[1.0, 1.0, 1.0]` before bloom sees it
- `UnrealBloomPass` threshold is set to `0.85` (4th arg in line 40)
- Compressed `1.0` barely clears the threshold, resulting in **minimal visible bloom**

Materials appear dull despite having high emissive intensity.

## The Solution: Bypass Tonemapping

Materials that need strong bloom must set `toneMapped: false` on the material to **output raw HDR values** to the render target. The bloom pass then sees full brightness.

```typescript
// Example: SupernovaNode sprite with HDR boost
const material = new THREE.SpriteMaterial({
  map: texture,
  color: 0xffffff,
  toneMapped: false,  // Critical: bypass ACES in fragment shader
  blending: THREE.AdditiveBlending,
  sizeAttenuation: true,
});
```

With `toneMapped: false`, HDR `[10, 10, 10]` reaches bloom uncompressed, creating visible glow.

## When to Use `toneMapped: false`

- Emissive-heavy materials that should glow (energy pillars, explosions, supernovas)
- Additive blending effects that rely on brightness for visual impact
- Any material where bloom visibility is critical

**Not needed for:**
- Diffuse/metallic objects that don't rely on bloom
- Post-processing is applied correctly when ACES is the intended output tone curve

## Related

- `demos/arena/src/setupPostProcessing.ts` — ACES tonemapping setup
- `demos/arena/src/nodes/SupernovaNode.ts` — HDR sprite with bloom
