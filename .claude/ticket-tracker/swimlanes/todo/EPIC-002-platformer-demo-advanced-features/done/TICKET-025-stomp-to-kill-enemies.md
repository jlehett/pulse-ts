---
id: TICKET-025
epic: EPIC-002
title: Stomp to kill enemies
status: done
priority: medium
branch: ticket-025-stomp-to-kill-enemies
created: 2026-02-26
updated: 2026-02-26
---

## Description

When the player lands on an enemy from above (Mario-style stomp), the enemy should be destroyed with a particle burst effect and the player should bounce upward. Currently enemies always kill the player on contact regardless of approach direction.

Detection approach: on collision with the player, check whether the player is above the enemy (player's feet above the enemy's top surface) and moving downward. If so, destroy the enemy and apply an upward impulse to the player for the bounce. Otherwise, use the existing respawn behavior.

Reuses `ParticleBurstNode` from TICKET-021 for the destruction effect (with enemy's red color instead of gold).

## Acceptance Criteria

- [x] Player stomping on enemy from above destroys the enemy
- [x] Particle burst spawns at the enemy's position on stomp
- [x] Player bounces upward after a successful stomp
- [x] Side and bottom collisions with enemies still respawn the player
- [x] Tests cover stomp detection logic
- [x] ParticleBurstNode supports configurable color (for red enemy burst vs gold collectible burst)

## Notes

- **2026-02-26**: Ticket created. Requires modifying EnemyNode collision handler and possibly extending ParticleBurstNode props.
- **2026-02-26**: Starting implementation.
- **2026-02-26**: Implementation complete. Added stomp detection to EnemyNode, configurable color to ParticleBurstNode, and tests for both.
