---
id: TICKET-132
epic: EPIC-025
title: "Arena migration: Three.js rendering"
status: in-progress
priority: high
created: 2026-03-13
updated: 2026-03-14
labels:
  - arena
  - migration
  - three
---

## Description

Refactor the arena demo to adopt all new `@pulse-ts/three` improvements:

- **useMesh material extensions**: Replace manual material creation in PlatformNode (texture maps,
  normal maps, emissive maps) with extended `useMesh` options.
- **useCustomMesh**: Replace raw `BufferGeometry` + `useObject3D` in StarfieldNode (Points),
  NebulaNode (PlaneGeometry + ShaderMaterial), and EnergyPillarsNode with `useCustomMesh`.
- **useInterpolatedPosition**: Replace manual previous/current position tracking in LocalPlayerNode
  and AiPlayerNode with one-liner interpolation hook.
- **createTexture**: Replace manual DataTexture creation functions in PlatformNode with
  `createTexture` utility.
- **useScreenProjection**: Add where world-to-screen projection is needed (overlay positioning).

## Affected Files

- `PlatformNode.ts` — useMesh extensions, createTexture (5 texture functions)
- `StarfieldNode.ts` — useCustomMesh (Points)
- `NebulaNode.ts` — useCustomMesh (Plane + ShaderMaterial)
- `EnergyPillarsNode.ts` — useCustomMesh or useMesh extensions
- `LocalPlayerNode.ts` — useInterpolatedPosition
- `AiPlayerNode.ts` — useInterpolatedPosition
- `RemotePlayerNode.ts` — useInterpolatedPosition (if applicable)

## Acceptance Criteria

- [ ] PlatformNode uses useMesh with texture map options instead of manual material
- [ ] StarfieldNode, NebulaNode, EnergyPillarsNode use useCustomMesh
- [ ] Player nodes use useInterpolatedPosition
- [ ] Manual DataTexture functions replaced with createTexture
- [ ] All manual geometry/material disposal removed (handled by hooks)
- [ ] All tests pass
- [ ] Lint clean

## Notes

- **2026-03-13**: Ticket created. Depends on EPIC-019 completion.
