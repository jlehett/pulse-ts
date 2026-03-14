---
id: TICKET-117
epic: EPIC-019
title: useMesh Material Extensions
status: done
priority: high
created: 2026-03-13
updated: 2026-03-14
branch: ticket-117-use-mesh-material-extensions
labels:
  - three
  - dx
---

## Description

Extend the existing `useMesh` hook in `@pulse-ts/three` to support the full range of
`MeshStandardMaterial` properties — texture maps (map, normalMap, emissiveMap, roughnessMap,
metalnessMap, alphaMap, envMap), render state (side, depthWrite, blending), and alternative
material types (standard, basic, phong).

Design doc: `design-docs/approved/033-use-mesh-material-extensions.md`

## Acceptance Criteria

- [x] Texture map options: map, normalMap, normalScale, emissiveMap, roughnessMap, metalnessMap, alphaMap, envMap
- [x] Render state options: side ('front'/'back'/'double'), depthWrite, blending ('normal'/'additive'/'multiply')
- [x] Material type option: materialType ('standard'/'basic'/'phong')
- [x] String enums for Three.js constants (not raw THREE.* values)
- [x] normalScale as `[number, number]` tuple
- [x] Backward compatible — all new options are optional
- [x] JSDoc with examples
- [x] Unit tests for new material options
- [x] Documentation updated

## Notes

- **2026-03-13**: Ticket created from approved design doc #33.
- **2026-03-14**: Starting implementation
- **2026-03-14**: Implementation complete
