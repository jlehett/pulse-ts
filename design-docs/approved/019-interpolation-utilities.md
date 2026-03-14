# Approved: Interpolation Utilities

> Pure math functions for interpolation, damping, and remapping — fundamental primitives for game development.

**Origin:** Engine Improvements #19 (Interpolation Utilities).

---

## Summary

A set of pure math utility functions in `@pulse-ts/core` for interpolation, damping, clamping, and remapping. These are universally needed across all game types and currently re-implemented inline with subtle variations across 10+ nodes.

---

## Problem

The arena demo manually implements lerp, exponential damping, and smoothstep in numerous places: AtmosphericDustNode uses asymmetric lerp for displacement, RemotePlayerNode uses interpolation lambda for network smoothing, overlay animations use ease curves, shockwave effects use smoothstep-like falloff. These primitives are scattered as inline math with no consistent implementation.

---

## API

```typescript
/**
 * Linear interpolation: a + (b - a) * t
 *
 * @param a - Start value.
 * @param b - End value.
 * @param t - Interpolation factor (0 = a, 1 = b). Not clamped.
 *
 * @example
 * lerp(0, 100, 0.5); // 50
 * lerp(0, 100, 1.5); // 150 (extrapolates)
 */
function lerp(a: number, b: number, t: number): number;

/**
 * Inverse lerp: (value - a) / (b - a), clamped to [0, 1].
 *
 * @param a - Range start.
 * @param b - Range end.
 * @param value - Value to normalize.
 *
 * @example
 * inverseLerp(0, 100, 50);  // 0.5
 * inverseLerp(0, 100, 150); // 1 (clamped)
 */
function inverseLerp(a: number, b: number, value: number): number;

/**
 * Frame-rate-independent exponential damping.
 * Smoothly approaches target regardless of frame rate.
 *
 * @param current - Current value.
 * @param target - Target value.
 * @param rate - Damping rate (higher = faster approach).
 * @param dt - Delta time in seconds.
 *
 * @example
 * // Network smoothing
 * position.x = damp(position.x, target.x, 25, dt);
 *
 * // Asymmetric damping (fast attack, slow release)
 * const rate = targetMag > currentMag ? 8 : 2;
 * currentX = damp(currentX, targetX, rate, dt);
 */
function damp(current: number, target: number, rate: number, dt: number): number;

/**
 * Hermite smoothstep: smooth transition from edge0 to edge1.
 * Returns 0 below edge0, 1 above edge1, smooth curve between.
 *
 * @param edge0 - Lower edge.
 * @param edge1 - Upper edge.
 * @param x - Input value.
 *
 * @example
 * smoothstep(0, 1, 0.5); // ~0.5 (smooth)
 * smoothstep(10, 0, 3);  // smooth falloff from 10 to 0
 */
function smoothstep(edge0: number, edge1: number, x: number): number;

/**
 * Clamp value between min and max.
 *
 * @param value - Input value.
 * @param min - Minimum bound.
 * @param max - Maximum bound.
 *
 * @example
 * clamp(15, 0, 10); // 10
 * clamp(-5, 0, 10); // 0
 */
function clamp(value: number, min: number, max: number): number;

/**
 * Remap value from [inMin, inMax] to [outMin, outMax].
 *
 * @param value - Input value.
 * @param inMin - Input range start.
 * @param inMax - Input range end.
 * @param outMin - Output range start.
 * @param outMax - Output range end.
 *
 * @example
 * remap(50, 0, 100, 0, 1);    // 0.5
 * remap(15, 10, 20, 0, 100);  // 50
 * remap(distance, 0, 50, 1, 0); // volume falloff
 */
function remap(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number;
```

---

## Design Decisions

- **Pure functions, no side effects** — Composable, testable, tree-shakeable.
- **No clamping on `lerp`** — Allows extrapolation when t is outside [0,1]. Use `clamp` explicitly when bounds are needed.
- **`inverseLerp` is clamped** — The inverse operation typically represents a normalized position within a range, so clamping to [0,1] is the expected behavior.
- **`damp` uses exponential formula** — `current + (target - current) * (1 - exp(-rate * dt))`. Frame-rate-independent by design, unlike naive `lerp(current, target, rate * dt)` which behaves differently at different frame rates.
- **Shader-compatible signatures** — `smoothstep(edge0, edge1, x)` matches the GLSL signature for familiarity.
