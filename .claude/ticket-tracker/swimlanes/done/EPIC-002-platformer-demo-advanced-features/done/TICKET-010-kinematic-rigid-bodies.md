---
id: TICKET-010
epic: EPIC-002
title: Kinematic rigid bodies
status: done
priority: high
created: 2026-02-25
updated: 2026-02-26
branch: ticket-010-kinematic-rigid-bodies
---

## Description

Implement the `kinematic` RigidBodyType in `@pulse-ts/physics`. The type already exists in the union (`'dynamic' | 'kinematic' | 'static'`) but currently behaves identically to `static` — no code handles it specially.

A kinematic body:
- Moves via scripted velocity (set `linearVelocity` / `angularVelocity` directly each step)
- Has infinite mass from the collision solver's perspective (forces and impulses don't affect it)
- Pushes and carries dynamic bodies that collide with it (velocity-based push, not force-based)
- Does NOT respond to gravity

Required changes:
- **`integration.ts`** — `integrateTransforms`: move kinematic bodies by their `linearVelocity * dt` and `angularVelocity * dt` (like dynamic, but skip the velocity-integration step)
- **`integration.ts`** — `integrateVelocities`: skip kinematic bodies (no gravity, no damping)
- **`solver.ts`** — treat kinematic bodies as infinite mass (invMass = 0) in constraint solving, but still apply the reaction to the dynamic counterpart
- **`PhysicsService.ts`** — `registerRigidBody` / `step`: no special changes needed; kinematic bodies are already in `this.bodies`

## Acceptance Criteria

- [ ] `type: 'kinematic'` on a RigidBody causes it to move by its velocity each step without responding to forces or gravity
- [ ] Dynamic bodies colliding with a kinematic body are pushed correctly (kinematic wins)
- [ ] Setting `linearVelocity` on a kinematic body moves it predictably
- [ ] All existing physics tests pass
- [ ] New tests covering kinematic body movement and kinematic-dynamic interaction

## Notes

- **2026-02-25**: Ticket created. Blocks TICKET-011 (moving platforms).
