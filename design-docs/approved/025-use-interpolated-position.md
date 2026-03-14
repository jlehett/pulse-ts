# Approved: Fixed-Step Interpolation Hook (`useInterpolatedPosition`)

> One-liner for smoothly interpolating a Three.js Object3D position from a physics Transform across fixed-step boundaries.

**Origin:** Engine Improvements #25 (`useInterpolatedPosition`).

---

## Summary

A new `useInterpolatedPosition` hook in `@pulse-ts/three` that automatically snapshots an ECS Transform each fixed tick and applies alpha-blended interpolation to a Three.js Object3D each render frame. Eliminates the most common fixed→frame interpolation boilerplate.

---

## Problem

Every physics-driven entity with a visual representation needs to interpolate between fixed-step positions each render frame to avoid jitter. This is 15 lines of identical boilerplate: declare previous position variables, snapshot in `useFixedEarly`, lerp in `useFrameUpdate` using `world.getAmbientAlpha()`. The arena demo has 2 separate implementations, and every new physics entity would duplicate the pattern.

---

## API

```typescript
/**
 * Smoothly interpolates a Three.js Object3D position from a Transform component
 * across fixed-step boundaries. Snapshots the transform each fixed tick and
 * applies alpha-blended interpolation each render frame.
 *
 * @param source - The ECS Transform component (updated in fixed step).
 * @param target - The Three.js Object3D whose position is driven.
 * @param options - Optional configuration.
 *
 * @example
 * // One line replaces 15 lines of manual interpolation
 * useInterpolatedPosition(transform, root);
 *
 * @example
 * // With snap override (e.g., teleport on round reset)
 * const snap = useRef(false);
 * useWatch(() => gameState.round, () => { snap.current = true; });
 *
 * useInterpolatedPosition(transform, root, {
 *     snap: () => {
 *         if (snap.current) { snap.current = false; return true; }
 *         return false;
 *     },
 * });
 */
function useInterpolatedPosition(
    source: Transform,
    target: THREE.Object3D,
    options?: {
        /** Override the alpha source. Default: world.getAmbientAlpha(). */
        getAlpha?: () => number;
        /** When this returns true, skip interpolation and snap directly to source. */
        snap?: () => boolean;
    },
): void;
```

---

## Usage Examples

### Basic — one line

```typescript
import { useInterpolatedPosition } from '@pulse-ts/three';

function LocalPlayerNode() {
    const transform = useComponent(Transform);
    const { root } = useMesh('sphere', { radius: PLAYER_RADIUS });

    // Smooth rendering of physics-driven position
    useInterpolatedPosition(transform, root);
}
```

### With snap on teleport

```typescript
function LocalPlayerNode() {
    const transform = useComponent(Transform);
    const { root } = useMesh('sphere', { radius: PLAYER_RADIUS });

    let shouldSnap = false;
    useWatch(() => gameState.round, () => { shouldSnap = true; });

    useInterpolatedPosition(transform, root, {
        snap: () => {
            if (shouldSnap) { shouldSnap = false; return true; }
            return false;
        },
    });
}
```

---

## Internal Behavior

1. **`useFixedEarly`** — Snapshots `source.localPosition.x/y/z` into internal `prevX/prevY/prevZ`.
2. **`useFrameUpdate`** — Reads `world.getAmbientAlpha()` (or custom `getAlpha`), lerps between previous and current position, sets `target.position`.
3. **Snap override** — When `snap()` returns true, skips interpolation and sets `target.position` directly from `source.localPosition`. Useful for teleports and round resets where interpolating between the old and new position would cause a visible sweep.

---

## Design Decisions

- **Position only, not rotation** — Rotation interpolation (slerp) is a different problem with different math. Can be added as a separate hook or option later if needed.
- **`snap` callback** — Teleports and round resets need to bypass interpolation. Without this, the entity would visually sweep from the old position to the new one over one frame.
- **`getAlpha` override** — Allows custom interpolation sources for unusual setups. Default uses the world's ambient alpha, which is correct for standard fixed-step physics.
