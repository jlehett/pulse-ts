# ThreeTRSSyncSystem Ordering

**Paths:** `packages/three/src/domain/systems/trsSync.ts`

## Key Fact

`ThreeTRSSyncSystem` runs at `updatePhase: 'late'` with `order: Number.MAX_SAFE_INTEGER - 2`. This means it executes **after all `useFrameUpdate` callbacks** and overwrites `root.position` from `Transform.localPosition`.

## Implication

**Setting `root.position` directly in `useFrameUpdate` has no visible effect** — trsSync will overwrite it on the same frame. To move a mesh to a custom position (e.g., during instant replay), you must set `transform.localPosition` instead, typically in `useFixedUpdate`. trsSync will then sync it to the Three.js scene graph with interpolation.

## Why Normal Interpolation Works

LocalPlayerNode's manual interpolation in `useFrameUpdate` (using `prevX`, `cur.x`, `alpha`) appears to work because trsSync does its own equivalent interpolation via `getLocalTRS(trs, alpha)`. Both produce the same result from the same transform data, so trsSync "overwriting" the manual interpolation is invisible — the values match.

## Exception

Direct `root.position` writes are valid for **child objects** added via `useObject3D()` (not the root itself), since trsSync only iterates roots registered with `ThreeService`.
