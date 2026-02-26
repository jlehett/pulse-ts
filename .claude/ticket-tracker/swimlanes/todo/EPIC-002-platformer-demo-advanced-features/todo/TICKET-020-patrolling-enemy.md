---
id: TICKET-020
epic: EPIC-002
title: Patrolling enemy
status: todo
branch: ticket-020-patrolling-enemy
priority: medium
created: 2026-02-25
updated: 2026-02-26
---

## Description

Add a simple patrolling enemy that walks back and forth between two points. Touching the enemy kills the player (respawn at last checkpoint). The enemy should be physically solid to other objects but not affected by player collision forces.

- `EnemyNode` — a visually distinct character (e.g., red/dark box or capsule mesh)
- Uses a kinematic rigid body (from TICKET-010) to patrol between two waypoints at a fixed speed
- On collision with the player, trigger player death/respawn
- Reverses direction when reaching a waypoint or when a forward raycast detects a drop (edge detection)
- Enemy definitions added to `level.ts`

## Acceptance Criteria

- [ ] Enemy patrols back and forth between two configured waypoints
- [ ] Player touching the enemy respawns at last checkpoint
- [ ] Enemy reverses at waypoints (and optionally at ledge edges)
- [ ] Enemy is visually distinct from platforms and the player
- [ ] Placeable via `level.ts`

## Notes

- **2026-02-25**: Ticket created. Depends on TICKET-010 (kinematic bodies) for correct movement behavior.
