---
id: TICKET-077
epic: EPIC-012
title: Post-processing pipeline (bloom, FXAA, tone mapping)
status: done
branch: ticket-077-post-processing-pipeline
priority: high
created: 2026-03-02
updated: 2026-03-02
labels:
  - engine
  - rendering
  - arena
---

## Description

Add EffectComposer support to the `@pulse-ts/three` engine package and set up a
post-processing pipeline in the arena demo. This is the foundation ticket — bloom
makes emissive materials (platform ring, particles) glow, tone mapping improves
color response, and OutputPass handles color space conversion.

### Engine changes (`packages/three/`)
- Add optional `composer` field + `setComposer()` method to `ThreeService`
- Update `ThreeRenderSystem` to use `composer.render()` when available
- Update `resizeToCanvas()` to resize composer alongside renderer

### Demo changes (`demos/arena/`)
- Create `setupPostProcessing.ts` with EffectComposer setup
- RenderPass → UnrealBloomPass (strength 0.4, radius 0.3, threshold 0.85) → OutputPass
- ACESFilmic tone mapping, exposure 1.0
- Call from `main.ts` in both local and online game setup

## Acceptance Criteria

- [x] Engine: ThreeService accepts an optional EffectComposer via setComposer()
- [x] Engine: ThreeRenderSystem renders via composer when set, falls back to renderer.render()
- [x] Engine: Composer resizes correctly when canvas resizes
- [x] Demo: Bloom visible on platform edge ring and particle effects
- [x] Demo: Scene doesn't wash out (threshold tuned correctly)
- [x] All engine and demo tests pass

## Notes

- **2026-03-02**: Ticket created.
- **2026-03-02**: Starting implementation.
- **2026-03-02**: Done. Engine: added `composer` field + `setComposer()` to ThreeService, branching in ThreeRenderSystem. Demo: `setupPostProcessing.ts` with RenderPass → UnrealBloomPass → OutputPass + ACESFilmic tone mapping.
