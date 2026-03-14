---
id: TICKET-114
epic: EPIC-018
title: Noise Function Utilities
status: todo
priority: medium
created: 2026-03-13
updated: 2026-03-13
labels:
  - core
  - math
---

## Description

Add simplex noise functions to `@pulse-ts/core`: `noise2D`, `noise3D`, `fbm2D` (fractional
Brownian motion), and `curlNoise2D` (divergence-free 2D vector field). Pure math utilities
for procedural generation — terrain, particles, shader effects, AI wander patterns.

Design doc: `design-docs/approved/047-noise-utilities.md`

## Acceptance Criteria

- [ ] `noise2D(x, y)` returns simplex noise in [-1, 1]
- [ ] `noise3D(x, y, z)` returns simplex noise in [-1, 1]
- [ ] `fbm2D(x, y, options?)` returns layered noise with configurable octaves/persistence/lacunarity
- [ ] `curlNoise2D(x, z, options?)` returns `[dx, dz]` divergence-free displacement
- [ ] Sensible defaults: octaves=4, persistence=0.5, lacunarity=2.0
- [ ] All functions are pure, no state, no dependencies
- [ ] JSDoc with examples
- [ ] Unit tests for output ranges, determinism, curl properties
- [ ] Documentation updated

## Notes

- **2026-03-13**: Ticket created from approved design doc #47.
