---
id: TICKET-117
epic: EPIC-019
title: useMesh Material Extensions
status: in-progress
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

- [ ] Texture map options: map, normalMap, normalScale, emissiveMap, roughnessMap, metalnessMap, alphaMap, envMap
- [ ] Render state options: side ('front'/'back'/'double'), depthWrite, blending ('normal'/'additive'/'multiply')
- [ ] Material type option: materialType ('standard'/'basic'/'phong')
- [ ] String enums for Three.js constants (not raw THREE.* values)
- [ ] normalScale as `[number, number]` tuple
- [ ] Backward compatible — all new options are optional
- [ ] JSDoc with examples
- [ ] Unit tests for new material options
- [ ] Documentation updated

## Notes

- **2026-03-13**: Ticket created from approved design doc #33.
- **2026-03-14**: Starting implementation
