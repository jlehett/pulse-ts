---
paths:
  - "packages/network/src/domain/systems/InterpolationSystem.ts"
---
# InterpolationSystem Ordering

## Key Fact

`InterpolationSystem` runs at `updatePhase: 'update'` with `order: 100`. It **unconditionally overwrites** `transform.localPosition` every frame for any entity registered as a `consumer` via `useReplicateTransform()`.

## Implication for Position Overrides

**You cannot override a replicated entity's position in a default-order `useFrameUpdate`** — the interpolation system will revert it at order 100. To set a custom position (e.g., replay playback):

- Use `useFrameUpdate` with `order > 100` and write to `transform.localPosition` (not `root.position`)
- The ThreeTRSSyncSystem (late phase) will then sync the updated localPosition to `root.position`

Setting `root.position` directly is futile; it gets overwritten by ThreeTRSSyncSystem's copy from localPosition, which was already rewritten by InterpolationSystem.

## Related

- See `.claude/rules/three/trs-sync-ordering.md` for the complete pipeline: InterpolationSystem → localPosition → ThreeTRSSyncSystem → root.position
