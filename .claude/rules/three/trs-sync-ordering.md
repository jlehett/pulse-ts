---
paths:
  - "packages/three/src/domain/systems/trsSync.ts"
---
# ThreeTRSSyncSystem Ordering

## Key Fact

`ThreeTRSSyncSystem` runs at `updatePhase: 'late'` with `order: Number.MAX_SAFE_INTEGER - 2`. This means it executes **after all `useFrameUpdate` callbacks** and overwrites `root.position` from `Transform.localPosition`.

## Implication

**Setting `root.position` directly in `useFrameUpdate` has no visible effect** — trsSync will overwrite it on the same frame. To move a mesh to a custom position (e.g., during instant replay), you must set `transform.localPosition` instead, typically in `useFixedUpdate`. trsSync will then sync it to the Three.js scene graph with interpolation.

## Why Normal Interpolation Works

LocalPlayerNode's manual interpolation in `useFrameUpdate` (using `prevX`, `cur.x`, `alpha`) appears to work because trsSync does its own equivalent interpolation via `getLocalTRS(trs, alpha)`. Both produce the same result from the same transform data, so trsSync "overwriting" the manual interpolation is invisible — the values match.

## InterpolationSystem Interaction (Network Replication)

When an entity is registered as a `consumer` via `useReplicateTransform` in packages/network:

1. **InterpolationSystem** (packages/network, order 100, update phase) overwrites `transform.localPosition` with interpolated values
2. **ThreeTRSSyncSystem** (packages/three, late phase) then copies that `localPosition` to `root.position`

**Consequence:** For replicated entities, **setting `root.position` directly in a default-order `useFrameUpdate` is futile** — InterpolationSystem will overwrite `localPosition` at order 100, then trsSync copies that back to `root.position`, undoing your write.

**Solution:** To override a replicated entity's position (e.g., instant replay):
- Use `useFrameUpdate` with `order > 100` and set `transform.localPosition` (not `root.position`)
- Or use a late-phase callback to bypass the interpolation system

**Key files:**
- `packages/network/src/domain/systems/InterpolationSystem.ts` — order 100, update phase
- `packages/network/src/domain/services/InterpolationService.ts` — performs smoothing

## Exception

Direct `root.position` writes are valid for **child objects** added via `useObject3D()` (not the root itself), since trsSync only iterates roots registered with `ThreeService`.
