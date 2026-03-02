---
id: TICKET-078
epic: EPIC-012
title: Arena visual polish (lighting, materials, platform texture)
status: in-progress
branch: ticket-078-arena-visual-polish
priority: medium
created: 2026-03-02
updated: 2026-03-02
labels:
  - rendering
  - arena
---

## Description

Enhance the 3D scene with better lighting, materials, and surface detail. Builds
on the bloom post-processing from TICKET-077 to make emissive elements glow.

### Engine changes (`packages/three/`)
- Add `usePointLight` hook to `useLighting.ts` following the existing pattern
- Export from `public/index.ts`

### Demo changes (`demos/arena/`)
- Add colored accent point lights in ArenaNode (teal from one side, coral from the other)
- Generate a procedural grid normal map in PlatformNode for subtle surface detail
- Enhance player materials: add subtle emissive glow, increase metalness slightly
- Apply same material changes to RemotePlayerNode

## Acceptance Criteria

- [ ] usePointLight hook available in @pulse-ts/three
- [ ] Colored accent lights visible on platform surface
- [ ] Platform grid texture subtle but visible under lighting
- [ ] Player spheres have faint emissive glow under bloom
- [ ] All tests pass

## Notes

- **2026-03-02**: Ticket created.
- **2026-03-02**: Starting implementation.
