---
id: TICKET-046
epic: EPIC-008
title: Collision knockback
status: done
priority: medium
branch: ticket-046-collision-knockback
created: 2026-02-26
updated: 2026-02-28
labels:
  - arena
  - physics
  - effects
  - audio
---

## Description

`useOnCollisionStart` in `LocalPlayerNode` — compute knockback impulse when colliding with the remote player. Impact sound via `useSound` and a small particle burst at the contact point. Pure `computeKnockback` function with colocated test.

## Acceptance Criteria

- [x] `useOnCollisionStart` detects collision with remote player
- [x] `computeKnockback` pure function computes impulse direction and magnitude
- [x] Knockback impulse applied to local player rigid body
- [x] Impact sound plays on collision
- [x] Small particle burst (16 particles) at contact point
- [x] Colocated test for `computeKnockback`

## Notes

- **2026-02-26**: Ticket created.
- **2026-02-28**: Starting implementation.
- **2026-02-28**: Implementation complete. Added `computeKnockback` pure function with KNOCKBACK_FORCE=8, `useOnCollisionStart` handler with PlayerTag detection, impact sound (square wave), 16-particle burst at collision midpoint, and 6 new colocated tests. All 27 tests pass.
