---
id: TICKET-003
epic: EPIC-001
title: Remove Transform Proxy
status: done
priority: critical
created: 2026-02-24
updated: 2026-02-25
---

## Description

Replace the Proxy-based dirty tracking in `Transform.ts` with explicit setter methods or `Object.defineProperty`. This is the highest-severity performance issue in the engine — V8 de-optimizes Proxy traps in hot loops, and every write to `localPosition.x`, `localRotation.w`, etc. currently pays this cost.

- **File:** `packages/core/src/domain/components/spatial/Transform.ts:29-49`
- The Proxy wraps `Vec3` and `Quat` fields to set a dirty flag on write
- `transform.bench.ts` already identifies this as the primary performance suspect
- The PlayerNode updates position 3× per frame; collectibles animate each frame

## Acceptance Criteria

- [ ] Proxy wrappers removed from `Transform.ts`
- [ ] Dirty tracking preserved via explicit setters or equivalent mechanism
- [ ] All existing Transform tests pass
- [ ] Benchmark shows measurable improvement over baseline from TICKET-002
- [ ] JSDoc updated on any changed public API

## Notes

- **2026-02-24**: Ticket created. Blocked by TICKET-002 (need baseline before measuring improvement). Highest-impact change in the epic.
- **2026-02-25**: Status changed to in-progress
- **2026-02-25**: Status changed to done. Proxy replaced with Object.defineProperty accessors. setLocal 3.8x faster, mutate+recompute batch +25%. PR #10 merged.
