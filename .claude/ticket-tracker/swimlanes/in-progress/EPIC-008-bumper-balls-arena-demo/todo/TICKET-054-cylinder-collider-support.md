---
id: TICKET-054
epic: EPIC-008
title: Cylinder collider support
status: todo
priority: medium
created: 2026-03-01
updated: 2026-03-01
labels:
  - physics
  - engine
  - arena
---

## Description

Add `useCylinderCollider(radius, height, options)` hook to `@pulse-ts/physics`, then update the arena demo's `PlatformNode` to use it instead of the current `useBoxCollider`. The arena platform is visually a cylinder but uses a box collider, so players can walk past the circular edge at the corners without falling off.

## Acceptance Criteria

- [ ] `useCylinderCollider(radius, height, options)` hook added to `@pulse-ts/physics`
- [ ] Cylinder collision detection integrated into the physics engine (cylinder vs sphere, cylinder vs box)
- [ ] Unit tests for the new collider shape and its interactions
- [ ] Arena `PlatformNode` updated to use `useCylinderCollider` instead of `useBoxCollider`
- [ ] Players fall off at the circular edge, not the square corners
- [ ] JSDoc for the new public hook

## Notes

- **2026-03-01**: Ticket created.
