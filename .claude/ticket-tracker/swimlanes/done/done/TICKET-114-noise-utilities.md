---
id: TICKET-114
epic: EPIC-018
title: Noise Function Utilities
status: done
priority: medium
branch: ticket-114-noise-utilities
created: 2026-03-13
updated: 2026-03-14
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

- [x] `noise2D(x, y)` returns simplex noise in [-1, 1]
- [x] `noise3D(x, y, z)` returns simplex noise in [-1, 1]
- [x] `fbm2D(x, y, options?)` returns layered noise with configurable octaves/persistence/lacunarity
- [x] `curlNoise2D(x, z, options?)` returns `[dx, dz]` divergence-free displacement
- [x] Sensible defaults: octaves=4, persistence=0.5, lacunarity=2.0
- [x] All functions are pure, no state, no dependencies
- [x] JSDoc with examples
- [x] Unit tests for output ranges, determinism, curl properties
- [x] Documentation updated

## Notes

- **2026-03-13**: Ticket created from approved design doc #47.
- **2026-03-14**: Starting implementation.
- **2026-03-14**: Implementation complete. 19 tests covering output ranges, determinism, variation, defaults, parameter effects, and divergence-free curl property. Exported all functions and option types from public math API.
