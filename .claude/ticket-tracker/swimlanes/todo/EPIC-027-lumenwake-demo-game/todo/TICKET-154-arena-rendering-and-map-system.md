---
id: TICKET-154
title: Arena rendering & map system
status: todo
priority: high
created: 2026-05-16
updated: 2026-05-16
depends_on:
  - TICKET-153
labels:
  - lumenwake
  - rendering
---

## Description

Build the data-driven arena/map system with 3 distinct map variants, hex-grid floor, darkness boundary, and bloom post-processing.

## Acceptance Criteria

- [ ] Data-driven map config format (obstacle positions, spawn points, boundary shape)
- [ ] GridFloorNode with hex-grid pattern and light-reactive tiles (glow near players)
- [ ] DarknessEdgeNode showing visible light boundary that can contract
- [ ] 3 map variants implemented:
  - Nexus: circular arena, central crystal pillar, symmetrical
  - Fracture: rectangular, broken floor gaps (darkness pits), asymmetric cover
  - Convergence: hexagonal, 6 chargeable light pillars at edges, open center
- [ ] Bloom post-processing pipeline
- [ ] Obstacle geometry (crystal pillars, walls) rendered as emissive shapes
- [ ] Map selection works from menu/lobby

## Notes

- 2026-05-16: Created. Depends on TICKET-153 (scaffold).
