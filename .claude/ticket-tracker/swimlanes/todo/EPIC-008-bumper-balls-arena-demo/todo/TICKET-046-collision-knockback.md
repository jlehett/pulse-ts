---
id: TICKET-046
epic: EPIC-008
title: Collision knockback
status: todo
priority: medium
created: 2026-02-26
updated: 2026-02-26
labels:
  - arena
  - physics
  - effects
  - audio
---

## Description

`useOnCollisionStart` in `LocalPlayerNode` — compute knockback impulse when colliding with the remote player. Impact sound via `useSound` and a small particle burst at the contact point. Pure `computeKnockback` function with colocated test.

## Acceptance Criteria

- [ ] `useOnCollisionStart` detects collision with remote player
- [ ] `computeKnockback` pure function computes impulse direction and magnitude
- [ ] Knockback impulse applied to local player rigid body
- [ ] Impact sound plays on collision
- [ ] Small particle burst (16 particles) at contact point
- [ ] Colocated test for `computeKnockback`

## Notes

- **2026-02-26**: Ticket created.
