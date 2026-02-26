---
id: TICKET-004
epic: EPIC-001
title: Pool Vec3/Quat in collision detection
status: done
priority: high
created: 2026-02-24
updated: 2026-02-25
---

## Description

Introduce a simple object pool so narrow-phase collision math reuses pre-allocated `Vec3` and `Quat` instances instead of allocating new ones per collision pair. Currently 52+ `new Vec3()` / `new Quat()` calls occur per detection pass, generating significant GC pressure.

- **File:** `packages/physics/src/domain/engine/detection/detect.ts`
- 52+ `new Vec3()` and `new Quat()` allocations per frame (grep confirmed)
- These are short-lived temporaries used only during the detection pass
- At 60Hz with multiple collision pairs, this creates sustained GC load

## Acceptance Criteria

- [ ] A pool or scratch-buffer strategy is in place for temporary Vec3/Quat in `detect.ts`
- [ ] No observable change in collision detection correctness (all tests pass)
- [ ] Physics benchmark shows reduced allocation rate vs baseline from TICKET-002
- [ ] The pool is scoped to the physics package (not a shared global)

## Notes

- **2026-02-24**: Ticket created. Blocked by TICKET-002 (need baseline). Can be implemented alongside TICKET-005 and TICKET-006 once baseline is captured.
- **2026-02-25**: Status changed to in-progress
- **2026-02-25**: Status changed to done. Vec3 pool implemented in detect.ts. PR #11 merged.
