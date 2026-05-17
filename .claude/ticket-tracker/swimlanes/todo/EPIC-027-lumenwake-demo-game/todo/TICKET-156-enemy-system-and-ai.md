---
id: TICKET-156
title: Enemy system & AI
status: todo
priority: high
created: 2026-05-16
updated: 2026-05-16
depends_on:
  - TICKET-154
labels:
  - lumenwake
  - gameplay
  - ai
---

## Description

Implement the enemy (voidform) system with 3 enemy types, AI steering, health, damage-on-contact, and death effects.

## Acceptance Criteria

- [ ] EnemySpawnerNode: spawns enemies from arena edges based on wave config
- [ ] Shard enemy (TetrahedronGeometry): fast swarm, moves toward nearest player
- [ ] Nullcube enemy (BoxGeometry): tanky, directional shield absorbs damage from one face, must rotate to find weakness
- [ ] Eclipser enemy (DodecahedronGeometry): slower, spawns local darkness zones that damage players
- [ ] Enemy health system with damage tracking
- [ ] Damage-on-contact with players
- [ ] Death effects: shatter into dark fragments (particle burst)
- [ ] Matte dark materials (MeshStandardMaterial, low roughness, dark purple/grey)
- [ ] Hit-flash feedback (brief emissive flash on damage)
- [ ] Basic steering toward players, avoidance of obstacles

## Notes

- 2026-05-16: Created. Depends on TICKET-154 (arena rendering). Can be built in parallel with TICKET-155.
