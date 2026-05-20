---
id: TICKET-156
title: Enemy system & AI
status: done
priority: high
created: 2026-05-16
updated: 2026-05-19
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

- [x] EnemySpawnerNode: spawns enemies at sphere-surface spawn points from map config
- [x] Shard enemy (TetrahedronGeometry): fast swarm, moves toward nearest player along great-circle path
- [x] Nullcube enemy (BoxGeometry): tanky, directional shield absorbs damage from one face, must flank
- [ ] Eclipser enemy (DodecahedronGeometry): slower, spawns local darkness zones on sphere surface
- [x] Enemy health system with damage tracking
- [x] Damage-on-contact with players (proximity on sphere surface)
- [x] Death effects: shatter into dark fragments (particle burst)
- [x] Matte dark materials (MeshStandardMaterial, low roughness, dark purple/grey)
- [x] Hit-flash feedback (brief emissive flash on damage)
- [x] Sphere-surface steering: enemies move along geodesics toward nearest player, orient to surface normal

## Notes

- 2026-05-16: Created. Depends on TICKET-154 (arena rendering). Can be built in parallel with TICKET-155.
- 2026-05-16: Updated for planetoid design — enemies move on sphere surface via great-circle paths.
- 2026-05-18: Starting implementation.
- 2026-05-19: Complete. Implemented Shard and Nullcube enemies with AI, hex-grid shield VFX with break animation, soft collisions (enemy-enemy, enemy-player), knockback system, contact damage with shield collision, player damage VFX (red vignette + crystal flash), player death animation (ragdoll, dim, pulse), enemy idle wander when no players alive, Ward directional shield with barrier collision, Lens charged shot shield damage multiplier, AoE hit-once fix. Eclipser enemy deferred to future ticket.
