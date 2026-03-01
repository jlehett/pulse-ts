---
id: TICKET-056
title: Cylinder-cylinder collision detection
status: todo
priority: low
created: 2026-03-01
updated: 2026-03-01
labels:
  - physics
  - engine
---

## Description

Add cylinder-cylinder collision detection to `@pulse-ts/physics`. Currently `detectCollision()` returns `null` for cylinder-cylinder pairs (deferred from TICKET-054). This involves handling parallel vs skew axis cases and computing closest points between two finite cylinders with flat disc caps.

## Acceptance Criteria

- [ ] `detectCollision()` returns a valid contact for overlapping cylinder-cylinder pairs
- [ ] Handles parallel axes, skew axes, and coaxial edge cases
- [ ] Unit tests covering overlap, separation, and edge cases
- [ ] JSDoc on any new internal helpers

## Notes

- **2026-03-01**: Ticket created. Follow-up to TICKET-054 (cylinder collider support).
