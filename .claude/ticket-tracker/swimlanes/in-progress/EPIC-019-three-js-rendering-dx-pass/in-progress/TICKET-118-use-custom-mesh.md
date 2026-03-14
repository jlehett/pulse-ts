---
id: TICKET-118
epic: EPIC-019
title: useCustomMesh Hook
status: in-progress
priority: high
created: 2026-03-13
updated: 2026-03-14
branch: ticket-118-use-custom-mesh
labels:
  - three
  - dx
---

## Description

Implement `useCustomMesh` in `@pulse-ts/three` that accepts user-provided geometry and
material factory functions while handling lifecycle cleanup, shadow configuration, and
scene graph management. Supports Mesh, Points, Line, and LineSegments object types.

Design doc: `design-docs/approved/038-use-custom-mesh.md`

## Acceptance Criteria

- [ ] `useCustomMesh({ geometry, material, type? })` creates custom geometry + material
- [ ] Factory functions for geometry and material (hook owns lifecycle)
- [ ] Automatic disposal of geometry and material on node destroy
- [ ] Type parameter: 'mesh' (default), 'points', 'line', 'lineSegments'
- [ ] Shadow options (castShadow, receiveShadow) for mesh type only
- [ ] Returns `{ root, object, material, geometry }` for runtime manipulation
- [ ] JSDoc with examples
- [ ] Unit tests for creation, disposal, all object types
- [ ] Documentation updated

## Notes

- **2026-03-13**: Ticket created from approved design doc #38.
- **2026-03-14**: Starting implementation
