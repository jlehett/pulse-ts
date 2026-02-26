---
id: TICKET-036
epic: EPIC-007
title: Extract getKinematicSurfaceVelocity to @pulse-ts/physics
status: done
priority: medium
created: 2026-02-26
updated: 2026-02-26
---

## Description

Move `getKinematicSurfaceVelocityXZ()` from `demos/platformer/src/nodes/PlayerNode.ts` to `@pulse-ts/physics` as a public utility. Generalize to return full 3D velocity (not just XZ).

The function computes the exact surface velocity at a contact point on a kinematic body, accounting for both linear and angular (rotational) velocity using arc rotation rather than tangent approximation.

## Acceptance Criteria

- [x] `getKinematicSurfaceVelocity()` exported from `@pulse-ts/physics`
- [x] Returns full 3D velocity vector (not just XZ)
- [x] Maintains the arc rotation approach (avoids tangent-only drift)
- [x] Full JSDoc with `@param`, `@returns`, `@example`
- [x] Colocated tests
- [x] Update platformer demo to import from `@pulse-ts/physics`
- [x] Remove the function from PlayerNode.ts

## Notes

- **2026-02-26**: Ticket created. Pure math function currently stranded in demo code — any game with kinematic platforms needs this.
- **2026-02-26**: Status changed to done
