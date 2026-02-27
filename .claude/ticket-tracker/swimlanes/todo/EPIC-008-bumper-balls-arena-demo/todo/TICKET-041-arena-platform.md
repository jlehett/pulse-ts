---
id: TICKET-041
epic: EPIC-008
title: Arena platform
status: todo
priority: medium
created: 2026-02-26
updated: 2026-02-26
labels:
  - arena
  - mesh
  - physics
---

## Description

`PlatformNode` — cylinder mesh (radius 10, height 0.5) with a box floor collider. No edge walls so players can be knocked off. Pulsing emissive ring via `useAnimate`. Colocated test verifying constants.

## Acceptance Criteria

- [ ] `PlatformNode` creates a cylinder mesh with radius 10, height 0.5
- [ ] Static box collider for the platform floor
- [ ] Pulsing emissive ring effect using `useAnimate`
- [ ] Colocated test (`PlatformNode.test.ts`) verifying platform constants
- [ ] Platform is mounted as a child of ArenaNode

## Notes

- **2026-02-26**: Ticket created.
