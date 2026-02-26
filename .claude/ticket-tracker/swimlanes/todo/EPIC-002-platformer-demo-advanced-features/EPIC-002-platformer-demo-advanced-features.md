---
id: EPIC-002
title: Platformer Demo — Advanced Features
status: todo
priority: medium
created: 2026-02-25
updated: 2026-02-25
---

## Description

Expand the platformer demo into a more complete, polished game. One ticket (TICKET-010) adds kinematic rigid body support to `@pulse-ts/physics` as a prerequisite for moving platforms; all other tickets are demo-local and will inform future engine and package decisions.

## Tickets

- TICKET-010: Kinematic rigid bodies (`@pulse-ts/physics`) — engine prereq
- TICKET-011: Moving & rotating platforms (blocked by TICKET-010)
- TICKET-012: Goal object + win screen
- TICKET-013: Hazard platforms (kill on contact)
- TICKET-014: Collectible counter HUD
- TICKET-015: Coyote time
- TICKET-016: Variable jump height (hold space = higher jump)
- TICKET-017: Dash ability
- TICKET-018: Level redesign with 2–3 stages (blocked by TICKET-011)
- TICKET-019: Checkpoints
- TICKET-020: Patrolling enemy
- TICKET-021: Particle burst on collectible pickup
- TICKET-022: Screen shake on hard landing
- TICKET-023: Sound effects (jump, collect, land, dash)

## Notes

- **2026-02-25**: Epic created. TICKET-010 is the only engine-level ticket; the rest are demo-local. Post-completion the demo will be used to identify what should be extracted to engine packages.
