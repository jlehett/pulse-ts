# Screen-Space Indicators for 3D Objects

**Paths:** `demos/arena/src/**/*`

## Pattern

For visual indicators that must appear centered on 3D objects (player rings, selection markers, distance labels), use **screen-space CSS elements projected via `Vector3.project(camera)`**, NOT 3D geometry attached to the scene graph.

## Why Not 3D Geometry

3D shapes (e.g., torus rings) attached to the scene graph are subject to perspective transformation. Even when centered on a world position, they appear **offset and distorted** relative to the camera's viewpoint, breaking the visual alignment.

## Implementation Pattern

1. Create a DOM element (div, svg, etc.) positioned `absolute` in a screen-space overlay
2. Each frame, project the target world position: `targetPos.project(camera)` → screen coordinates (0–1)
3. Transform the DOM element to screen coords and apply scale based on projected distance
4. Update each frame in the render loop

## Example

```typescript
// In render loop:
const screenPos = worldPos.project(camera); // Vector3.project() returns vec in range 0..1
const x = screenPos.x * window.innerWidth;
const y = (1 - screenPos.y) * window.innerHeight; // invert Y for DOM coords
indicator.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
```

## Benefits

- Visual alignment stays true regardless of camera angle or perspective
- Indicators remain crisply centered on their targets
- No need to track 3D geometry state or camera transformations manually
