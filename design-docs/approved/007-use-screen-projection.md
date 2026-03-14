# Approved: Screen-Space Projection Hook (`useScreenProjection`)

> Project 3D world positions to 2D screen-space pixel coordinates.

**Origin:** Engine Improvements #7 (`useScreenProjection`).

---

## Summary

A new `useScreenProjection` hook in `@pulse-ts/three` that returns a projection function for converting world-space positions to screen-space pixel coordinates. Reuses internal Vector3 to avoid per-frame allocation.

---

## Problem

Any game that places DOM elements over 3D objects (health bars, name tags, indicator rings, tooltips) needs to project world positions to screen coordinates. This requires manual Vector3 management, camera projection math, and coordinate conversion — 10+ lines of boilerplate per usage. The math is easy to get wrong (sign flips, half-width/height offsets).

---

## API

```typescript
interface ScreenPoint {
    /** Screen-space X in pixels (0 = left edge). */
    x: number;
    /** Screen-space Y in pixels (0 = top edge). */
    y: number;
    /** Normalized depth (0 = near, 1 = far). Useful for z-sorting overlays. */
    depth: number;
    /** Whether the point is in front of the camera. */
    visible: boolean;
}

interface WorldPoint {
    x: number;
    y: number;
    z: number;
}

/**
 * Returns a projection function that converts world-space positions
 * to screen-space pixel coordinates. Uses the active Three.js camera
 * and renderer dimensions. Reuses internal Vector3 to avoid allocation.
 *
 * @returns A function that projects a world point to screen space.
 *
 * @example
 * const project = useScreenProjection();
 *
 * useFrameUpdate(() => {
 *     const { x, y } = project(root.position);
 *     indicator.style.left = `${x}px`;
 *     indicator.style.top = `${y}px`;
 * });
 *
 * @example
 * // Computing screen-space radius from a world-space offset
 * const center = project(root.position);
 * const edge = project({
 *     x: root.position.x + RADIUS,
 *     y: root.position.y,
 *     z: root.position.z,
 * });
 * const screenRadius = Math.abs(edge.x - center.x);
 */
function useScreenProjection(): (position: WorldPoint) => ScreenPoint;
```

---

## Usage Example

```typescript
import { useScreenProjection } from '@pulse-ts/three';

function LocalPlayerNode() {
    const project = useScreenProjection();

    useFrameUpdate(() => {
        if (indicatorRing) {
            const { x, y } = project(root.position);
            const edge = project({
                x: root.position.x + PLAYER_RADIUS * INDICATOR_RING_SCALE,
                y: root.position.y,
                z: root.position.z,
            });
            const radius = Math.abs(edge.x - x);

            indicatorRing.style.width = `${radius * 2}px`;
            indicatorRing.style.height = `${radius * 2}px`;
            indicatorRing.style.left = `${x - radius}px`;
            indicatorRing.style.top = `${y - radius}px`;
        }
    });
}
```

---

## Design Decisions

- **Returns a function, not values** — The projection function is called per-frame by the consumer, not automatically. This avoids unnecessary work when the consumer doesn't need projection every frame.
- **Reuses internal Vector3** — The returned function reuses a single `THREE.Vector3` internally. Callers should not store the returned `ScreenPoint` across frames (it may be the same object).
- **`visible` flag** — Points behind the camera project to valid-looking coordinates but are not actually visible. The `visible` flag prevents placing DOM elements for off-screen objects.
- **`depth` field** — Enables z-sorting when multiple DOM elements are anchored to different 3D positions.
