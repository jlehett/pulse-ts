# Approved: Noise Function Utilities

> Simplex noise, fractional Brownian motion, and curl noise as pure math utilities.

**Origin:** Engine Improvements #47 (Noise Utilities).

---

## Summary

Pure math functions in `@pulse-ts/core` for procedural noise generation: `noise2D`, `noise3D`, `fbm2D`, and `curlNoise2D`. Fundamental building blocks for procedural generation — terrain, particles, shader effects, AI wander patterns, camera shake.

---

## Problem

The arena demo has a local `noise2D` implementation used for curl noise drift in `AtmosphericDustNode` (4 calls per particle per frame). Any game with organic-looking variation needs noise functions, and developers currently must vendor or reimplement them. Noise is as fundamental as `lerp` or `clamp` — it belongs in the engine's math utilities.

---

## API

```typescript
/**
 * 2D simplex noise returning a value in [-1, 1].
 *
 * @param x - X coordinate.
 * @param y - Y coordinate.
 * @returns Noise value in [-1, 1].
 *
 * @example
 * const n = noise2D(x * 0.1, y * 0.1); // scale down for smoother noise
 */
function noise2D(x: number, y: number): number;

/**
 * 3D simplex noise returning a value in [-1, 1].
 *
 * @param x - X coordinate.
 * @param y - Y coordinate.
 * @param z - Z coordinate.
 * @returns Noise value in [-1, 1].
 *
 * @example
 * const n = noise3D(x, y, time); // animated 2D noise using time as 3rd dimension
 */
function noise3D(x: number, y: number, z: number): number;

/**
 * Fractional Brownian motion — layered noise with configurable octaves.
 * Each octave doubles frequency and reduces amplitude by `persistence`.
 *
 * @param x - X coordinate.
 * @param y - Y coordinate.
 * @param options - Octave count, persistence, and lacunarity.
 * @returns Noise value (range depends on octaves and persistence).
 *
 * @example
 * const terrain = fbm2D(x, y, { octaves: 6, persistence: 0.5 });
 */
function fbm2D(x: number, y: number, options?: {
    octaves?: number;
    persistence?: number;
    lacunarity?: number;
}): number;

/**
 * Curl noise — divergence-free 2D vector field derived from scalar noise.
 * Useful for particle drift that naturally avoids convergence/divergence.
 *
 * @param x - X coordinate.
 * @param z - Z coordinate.
 * @param options - Epsilon for finite differences and scale factor.
 * @returns [dx, dz] displacement vector.
 *
 * @example
 * const [curlX, curlZ] = curlNoise2D(px, pz, { epsilon: 0.5, scale: 0.3 });
 * particle.x += curlX * dt;
 * particle.z += curlZ * dt;
 */
function curlNoise2D(x: number, z: number, options?: {
    epsilon?: number;
    scale?: number;
}): [number, number];
```

---

## Usage Examples

### Particle curl noise drift

```typescript
// Before — local import from demo
import { noise2D } from '../noise';

const e = 0.5;
const curlX = (noise2D(sx, sz + e) - noise2D(sx, sz - e)) / (2 * e);
const curlZ = -(noise2D(sx + e, sz) - noise2D(sx - e, sz)) / (2 * e);

// After — engine utility with curl helper
import { curlNoise2D } from '@pulse-ts/core';

const [curlX, curlZ] = curlNoise2D(sx, sz, { epsilon: 0.5, scale: 0.3 });
```

### Terrain generation

```typescript
import { fbm2D } from '@pulse-ts/core';

for (let x = 0; x < width; x++) {
    for (let z = 0; z < depth; z++) {
        heightmap[x][z] = fbm2D(x * 0.02, z * 0.02, { octaves: 6, persistence: 0.5 });
    }
}
```

### Animated variation

```typescript
import { noise3D } from '@pulse-ts/core';

// Use time as 3rd dimension for animated 2D noise
const flicker = noise3D(x * 0.5, y * 0.5, time * 2.0);
```

---

## Design Decisions

- **Simplex noise** — Faster than classic Perlin for the same quality, no visible grid artifacts, good gradient distribution.
- **Alongside existing math utilities** — Same location as `lerp`, `clamp`, `smoothstep` (#19). Pure functions, no state, no dependencies.
- **`curlNoise2D` as a convenience** — Computing curl from finite differences is a common pattern but easy to get wrong (sign errors, epsilon choice). The helper encapsulates the math.
- **`fbm2D` with sensible defaults** — `octaves: 4`, `persistence: 0.5`, `lacunarity: 2.0` are the standard defaults. Covers most use cases without configuration.
