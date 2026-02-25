---
id: TICKET-006
epic: EPIC-001
title: Verify and fix broad-phase fallback
status: todo
priority: medium
created: 2026-02-24
updated: 2026-02-24
---

## Description

Determine whether the O(n²) broad-phase fallback in `pairing.ts` is triggering in the platformer, fix the condition that causes it, and ensure the spatial grid is used consistently.

- **File:** `packages/physics/src/domain/engine/broadphase/pairing.ts:66`
- If the spatial grid produces no pairs (or fewer than the naive approach), it silently falls back to all-pairs O(n²) checking
- With 14 colliders spread across a large level (platforms at x: 0–34), the default cell size of 1.0 may be poorly tuned
- Fallback cost: (14 × 13) / 2 = 91 pairs tested per step vs. ~10–20 with a working grid

## Acceptance Criteria

- [ ] Confirmed (via logging or test) whether the O(n²) fallback is triggering in the platformer
- [ ] Root cause identified (bad cell size heuristic, incorrect fallback condition, or other)
- [ ] Fix applied — either remove the fallback condition, improve the heuristic, or make cell size dynamic
- [ ] Physics benchmark shows reduced broad-phase pair count vs baseline from TICKET-002
- [ ] All physics tests pass

## Notes

- **2026-02-24**: Ticket created. Blocked by TICKET-002 (need baseline to confirm improvement).
