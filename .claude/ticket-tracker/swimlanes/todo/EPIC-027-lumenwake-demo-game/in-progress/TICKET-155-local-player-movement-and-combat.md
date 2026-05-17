---
id: TICKET-155
title: Local player movement & combat
status: in-progress
priority: high
created: 2026-05-16
updated: 2026-05-16
depends_on:
  - TICKET-154
labels:
  - lumenwake
  - gameplay
branch: ticket-155-local-player-movement-and-combat
---

## Description

Implement the local player node with sphere-surface movement, aiming via mouse raycasting onto the planetoid, 3 class archetypes, primary attacks (geodesic projectiles), abilities, health system, and the lumenwake trail mechanic.

## Acceptance Criteria

- [ ] LocalPlayerNode: WASD movement tangent to sphere surface, constrained to sphere radius
- [ ] Mouse aiming: raycast onto sphere surface to determine aim point, projectiles follow great-circle arcs
- [ ] Gravity: per-frame force pulling player toward sphere center
- [ ] Player orientation: "up" = surface normal, "forward" = movement/aim direction
- [ ] 3 prism classes with distinct Three.js geometry:
  - Shard (Octahedron): DPS — rapid light bolts along geodesics, piercing beam (Q), photon dash (E)
  - Ward (Cube): Tank/Support — short-range pulse, light barrier (Q), sanctuary AoE heal (E)
  - Lens (Icosahedron): Burst/Control — charged shot, prism split fan (Q), slow field (E)
- [ ] Emissive glowing materials with player-specific colors (cyan, magenta, gold, green)
- [ ] Cooldown system for Q and E abilities
- [ ] Lumenwake trail: fading light trail on sphere surface behind player movement
- [ ] Health system with visual feedback (glow dims as health decreases)
- [ ] Camera integration: feed player position/forward to CameraNode for third-person follow

## Notes

- 2026-05-16: Created. Depends on TICKET-154 (arena rendering).
- 2026-05-16: Updated for planetoid design — movement on sphere surface, geodesic projectiles.
