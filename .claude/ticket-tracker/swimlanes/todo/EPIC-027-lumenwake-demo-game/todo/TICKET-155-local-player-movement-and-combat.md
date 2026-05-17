---
id: TICKET-155
title: Local player movement & combat
status: todo
priority: high
created: 2026-05-16
updated: 2026-05-16
depends_on:
  - TICKET-154
labels:
  - lumenwake
  - gameplay
---

## Description

Implement the local player node with movement, aiming, 3 class archetypes, primary attacks, abilities, health system, and the lumenwake trail mechanic.

## Acceptance Criteria

- [ ] LocalPlayerNode: WASD movement, mouse cursor aiming (top-down plane)
- [ ] 3 prism classes with distinct Three.js geometry:
  - Shard (Octahedron): DPS — rapid light bolts, piercing beam (Q), photon dash (E)
  - Ward (Cube): Tank/Support — short-range pulse, light barrier (Q), sanctuary AoE heal (E)
  - Lens (Icosahedron): Burst/Control — charged shot, prism split fan (Q), slow field (E)
- [ ] Emissive glowing materials with player-specific colors (cyan, magenta, gold, green)
- [ ] Cooldown system for Q and E abilities
- [ ] Lumenwake trail: fading light trail behind player movement (allies benefit from crossing it)
- [ ] Health system with visual feedback (glow dims as health decreases)
- [ ] Player death state and respawn/reform mechanic

## Notes

- 2026-05-16: Created. Depends on TICKET-154 (arena rendering).
