---
id: TICKET-011
epic: EPIC-002
title: Moving and rotating platforms
status: done
priority: high
created: 2026-02-25
updated: 2026-02-25
branch: ticket-011-moving-and-rotating-platforms
---

## Description

Add moving and rotating platform variants to the platformer demo using the kinematic rigid body support from TICKET-010.

- `MovingPlatformNode` — translates back and forth between two world-space points at a configurable speed
- `RotatingPlatformNode` — rotates around its Y axis at a configurable angular speed
- Both use `type: 'kinematic'` RigidBody; velocity is set each fixed step to drive movement
- Props should include: position, size, color (matching PlatformNode), plus movement-specific params

The level config (`config/level.ts`) should be extended to include moving and rotating platform definitions. Both variants should cast and receive shadows.

## Acceptance Criteria

- [x] `MovingPlatformNode` translates smoothly between two points and reverses direction
- [x] `RotatingPlatformNode` rotates continuously around its Y axis
- [ ] Player standing on a moving/rotating platform is carried along correctly — tracked as TICKET-024
- [x] Platforms cast and receive shadows
- [x] `level.ts` extended with typed definitions for both variants

## Notes

- **2026-02-25**: Ticket created. Blocked by TICKET-010. Blocks TICKET-018 (level redesign).
- **2026-02-25**: Status changed to done. MovingPlatformNode and RotatingPlatformNode implemented with velocity-based kinematic integration. Root cause of platforms not moving was a stale dist/index.js; fixed by adding @pulse-ts/* source aliases to Vite config. Platform riding (carrying the player) split into TICKET-024.
