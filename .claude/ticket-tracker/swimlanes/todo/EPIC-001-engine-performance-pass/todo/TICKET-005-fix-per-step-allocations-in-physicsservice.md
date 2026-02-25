---
id: TICKET-005
epic: EPIC-001
title: Fix per-step allocations in PhysicsService
status: todo
priority: medium
created: 2026-02-24
updated: 2026-02-24
---

## Description

Eliminate the per-physics-step `Map` creation and string key generation in `PhysicsService`. Currently a fresh `Map` is allocated every step (60×/sec) and collision pair keys are generated as strings (e.g., `"3|7"`). Both can be replaced with persistent, reusable structures.

- **File:** `packages/physics/src/domain/services/PhysicsService.ts:177-208`
- Lines 177–178: two new `Map` instances created every physics step
- Line 208: string key `` `${ai}|${bi}` `` generated per collision pair
- Fix: reuse Maps across steps (`.clear()` instead of `new Map()`); use integer pair IDs (e.g., `ai * MAX + bi`) instead of strings

## Acceptance Criteria

- [ ] Collision pair Maps are reused across steps (`.clear()` instead of `new Map()`)
- [ ] Pair keys use a numeric scheme, not string concatenation
- [ ] All physics tests pass
- [ ] Physics benchmark shows reduced allocation rate vs baseline from TICKET-002

## Notes

- **2026-02-24**: Ticket created. Blocked by TICKET-002 (need baseline). Relatively straightforward change with clear before/after measurement.
