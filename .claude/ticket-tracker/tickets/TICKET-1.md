---
id: TICKET-1
title: Fix Transform Proxy performance
status: open
priority: high
epic: EPIC-1
created: 2026-02-18
---

# TICKET-1: Fix Transform Proxy performance

## Problem

`Transform` uses `Proxy` objects (`makeDirtyVec3`, `makeDirtyQuat`) to auto-dirty on Vec3/Quat property writes. JS `Proxy` setters are a known V8 deoptimization — every `localPosition.x = ...` in the hot update path pays this cost. With many entities or fast fixed-step rates this compounds quickly.

## Acceptance Criteria

- [ ] `makeDirtyVec3` / `makeDirtyQuat` Proxy-based dirty tracking is removed
- [ ] Dirty marking is preserved (transform still knows when it needs a world recompute)
- [ ] All existing Transform tests pass
- [ ] New microbenchmark shows measurable improvement vs. baseline

## Notes

Possible approaches:
- Explicit setter methods (e.g., `setPosition(x, y, z)`) that mark dirty internally
- Custom getter/setter properties on the class (no Proxy overhead)
- Explicit `markDirty()` call pattern where users batch-mutate then commit

Preference is whatever eliminates Proxy while keeping the API ergonomic.
