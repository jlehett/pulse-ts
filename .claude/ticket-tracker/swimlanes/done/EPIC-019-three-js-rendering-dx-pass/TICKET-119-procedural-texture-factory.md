---
id: TICKET-119
epic: EPIC-019
title: Procedural Texture Factory (createTexture)
status: done
priority: medium
created: 2026-03-13
updated: 2026-03-14
branch: ticket-119-procedural-texture-factory
labels:
  - three
  - utility
---

## Description

Implement `createTexture` and `createTexture1D` utilities in `@pulse-ts/three` for
generating `THREE.DataTexture` from per-pixel rasterization callbacks. Handles buffer
allocation, DataTexture creation, and wrap/filter setup via string enums.

Design doc: `design-docs/approved/041-procedural-texture-factory.md`

## Acceptance Criteria

- [x] `createTexture(size, rasterize, options?)` creates a square DataTexture
- [x] `createTexture1D(width, rasterize, options?)` creates a 1×width DataTexture
- [x] Pixel callback returns `[R, G, B, A]` (0–255)
- [x] Options: wrap ('repeat'/'clamp'/'mirror'), filter ('linear'/'nearest'), format ('rgba'/'rgb')
- [x] String enums mapped to Three.js constants
- [x] Texture `needsUpdate` set automatically
- [x] JSDoc with examples
- [x] Unit tests for buffer creation, wrap/filter configuration
- [x] Documentation updated

## Notes

- **2026-03-13**: Ticket created from approved design doc #41.
- **2026-03-14**: Moved to in-progress. Beginning implementation.
- **2026-03-14**: Implementation complete. All 15 tests pass, lint clean.
