---
id: TICKET-054
epic: EPIC-008
title: Cylinder collider support
status: done
priority: medium
branch: ticket-054-cylinder-collider-support
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

- [x] `useCylinderCollider(radius, height, options)` hook added to `@pulse-ts/physics`
- [x] Cylinder collision detection integrated into the physics engine (cylinder vs sphere, cylinder vs box)
- [x] Unit tests for the new collider shape and its interactions
- [x] Arena `PlatformNode` updated to use `useCylinderCollider` instead of `useBoxCollider`
- [x] Players fall off at the circular edge, not the square corners
- [x] JSDoc for the new public hook

## Notes

- **2026-03-01**: Ticket created.
- **2026-03-01**: Status changed to in-progress. Starting implementation on branch `ticket-054-cylinder-collider-support`.
- **2026-03-01**: All criteria met. Implemented CylinderCollider class, useCylinderCollider hook, sphere-cylinder/cylinder-box/cylinder-plane detection, AABB computation, inertia tensor, and raycasting. Fixed inverted contact normal convention in sphere-cylinder and cylinder-box dispatch. Updated PlatformNode to use cylinder collider. All 87 tests pass, lint clean.
