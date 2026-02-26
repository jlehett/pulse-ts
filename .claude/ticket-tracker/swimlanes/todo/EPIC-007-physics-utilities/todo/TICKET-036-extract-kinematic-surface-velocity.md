---
id: TICKET-036
epic: EPIC-007
title: Extract getKinematicSurfaceVelocity to @pulse-ts/physics
status: todo
priority: medium
created: 2026-02-26
updated: 2026-02-26
---

## Description

Move `getKinematicSurfaceVelocityXZ()` from `demos/platformer/src/nodes/PlayerNode.ts` to `@pulse-ts/physics` as a public utility. Generalize to return full 3D velocity (not just XZ).

The function computes the exact surface velocity at a contact point on a kinematic body, accounting for both linear and angular (rotational) velocity using arc rotation rather than tangent approximation.

## Acceptance Criteria

- [ ] `getKinematicSurfaceVelocity()` exported from `@pulse-ts/physics`
- [ ] Returns full 3D velocity vector (not just XZ)
- [ ] Maintains the arc rotation approach (avoids tangent-only drift)
- [ ] Full JSDoc with `@param`, `@returns`, `@example`
- [ ] Colocated tests
- [ ] Update platformer demo to import from `@pulse-ts/physics`
- [ ] Remove the function from PlayerNode.ts

## Notes

- **2026-02-26**: Ticket created. Pure math function currently stranded in demo code — any game with kinematic platforms needs this.
