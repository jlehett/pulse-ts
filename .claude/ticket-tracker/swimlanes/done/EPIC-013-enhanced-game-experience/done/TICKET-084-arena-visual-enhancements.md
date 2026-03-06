---
id: TICKET-084
epic: EPIC-013
title: Arena visual enhancements
status: done
priority: medium
created: 2026-03-02
updated: 2026-03-02
branch: ticket-084-arena-visual-enhancements
labels:
  - rendering
  - arena
---

## Description

Enhance the arena with both atmospheric effects and platform improvements to make the
game world feel more alive and immersive without being too noisy.

### Atmospheric effects
- Floating particle dust/embers drifting through the scene
- Subtle starfield or nebula backdrop (distant geometry or skybox)
- Decorative elements like floating crystals or energy pillars around the arena edge

### Enhanced platform
- Glowing hexagonal grid pattern on the platform surface
- Animated energy lines flowing across the surface
- More dramatic edge glow on the arena ring
- Subtle rotating ring underneath the arena

## Acceptance Criteria

- [x] Floating particles visible in the scene
- [x] Background has depth (starfield/nebula)
- [x] Decorative elements around arena edge
- [x] Platform has detailed surface pattern
- [x] Edge glow is more dramatic
- [x] Visual enhancements don't impact performance significantly
- [x] All tests pass

## Notes

- **2026-03-02**: Ticket created.
- **2026-03-02**: Implementation complete. Added: AtmosphericDustNode (floating particle dust with player interaction), NebulaNode (FBM procedural nebula backdrop), StarfieldNode (800-point twinkling starfield), SupernovaNode (miniature supernova flashes with lemon-shaped corona sprites and bloom), EnergyPillarsNode (8 pulsing cyan pillars around arena edge). Platform enhanced with opaque dark space-purple surface, glowing cyan grid emissive map, energy line overlay, rotating ring glow, wake displacement shader, and hit ripple distortion. Mobile performance optimized: DPR capped at 2, shadows disabled, nebula FBM reduced to 2 octaves, wake rasterization throttled (32x32 + frame skip), curl noise skipped for dust. All 344 tests pass, lint clean.
