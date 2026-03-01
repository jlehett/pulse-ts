---
id: TICKET-057
title: Cylinder-capsule collision detection
status: todo
priority: low
created: 2026-03-01
updated: 2026-03-01
labels:
  - physics
  - engine
---

## Description

Add cylinder-capsule collision detection to `@pulse-ts/physics`. Currently `detectCollision()` returns `null` for cylinder-capsule pairs (deferred from TICKET-054). This involves computing the closest points between a finite cylinder (flat disc caps) and a capsule (hemispherical caps), combining segment-distance logic with cylinder surface math.

## Acceptance Criteria

- [ ] `detectCollision()` returns a valid contact for overlapping cylinder-capsule pairs
- [ ] Handles parallel, perpendicular, and skew axis orientations
- [ ] Unit tests covering overlap, separation, and edge cases
- [ ] JSDoc on any new internal helpers

## Notes

- **2026-03-01**: Ticket created. Follow-up to TICKET-054 (cylinder collider support).
