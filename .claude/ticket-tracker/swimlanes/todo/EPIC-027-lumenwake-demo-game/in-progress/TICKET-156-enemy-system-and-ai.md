---
id: TICKET-156
title: Enemy system & AI
status: in-progress
priority: high
created: 2026-05-16
updated: 2026-05-18
depends_on:
  - TICKET-154
labels:
  - lumenwake
  - gameplay
  - ai
branch: ticket-156-enemy-system-and-ai
---

## Description

Implement the enemy (voidform) system with 3 enemy types, AI steering on sphere surface, health, damage-on-contact, and death effects.

## Acceptance Criteria

- [ ] EnemySpawnerNode: spawns enemies at sphere-surface spawn points from map config
- [ ] Shard enemy (TetrahedronGeometry): fast swarm, moves toward nearest player along great-circle path
- [ ] Nullcube enemy (BoxGeometry): tanky, directional shield absorbs damage from one face, must flank
- [ ] Eclipser enemy (DodecahedronGeometry): slower, spawns local darkness zones on sphere surface
- [ ] Enemy health system with damage tracking
- [ ] Damage-on-contact with players (proximity on sphere surface)
- [ ] Death effects: shatter into dark fragments (particle burst)
- [ ] Matte dark materials (MeshStandardMaterial, low roughness, dark purple/grey)
- [ ] Hit-flash feedback (brief emissive flash on damage)
- [ ] Sphere-surface steering: enemies move along geodesics toward nearest player, orient to surface normal

## Notes

- 2026-05-16: Created. Depends on TICKET-154 (arena rendering). Can be built in parallel with TICKET-155.
- 2026-05-16: Updated for planetoid design — enemies move on sphere surface via great-circle paths.
- 2026-05-18: Starting implementation.
