---
id: TICKET-154
title: Arena rendering & map system
status: done
priority: high
created: 2026-05-16
updated: 2026-05-16
depends_on:
  - TICKET-153
labels:
  - lumenwake
  - rendering
branch: ticket-154-arena-rendering-and-map-system
---

## Description

Build the data-driven arena/map system with 3 distinct map variants, hex-grid floor, darkness boundary, and bloom post-processing.

## Acceptance Criteria

- [x] Data-driven map config format (obstacle positions, spawn points, boundary shape)
- [x] GridFloorNode with hex-grid pattern and light-reactive tiles (glow near players)
- [x] DarknessEdgeNode showing visible light boundary that can contract
- [x] 3 map variants implemented:
  - Nexus: circular arena, central crystal pillar, symmetrical
  - Fracture: rectangular, broken floor gaps (darkness pits), asymmetric cover
  - Convergence: hexagonal, 6 chargeable light pillars at edges, open center
- [x] Bloom post-processing pipeline
- [x] Obstacle geometry (crystal pillars, walls) rendered as emissive shapes
- [x] Map selection works from menu/lobby

## Notes

- 2026-05-16: Created. Depends on TICKET-153 (scaffold).
- 2026-05-16: Starting implementation.
- 2026-05-16: Complete. All 3 maps implemented with custom shader grid floor, darkness edge, and obstacle rendering.
