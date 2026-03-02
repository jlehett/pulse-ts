---
id: TICKET-070
epic: EPIC-011
title: Mobile performance optimizations
status: todo
priority: medium
created: 2026-03-01
updated: 2026-03-01
labels:
  - performance
  - mobile
  - arena
---

## Description

Detect mobile devices and reduce rendering load for smooth gameplay. Lower or disable
shadow maps, reduce particle counts and emission rates, cap `devicePixelRatio` at 2x,
and disable antialiasing on mobile. Add a simple mobile detection utility. Key files:
`demos/arena/src/main.ts`, `demos/arena/src/nodes/ArenaNode.ts`,
`demos/arena/src/nodes/LocalPlayerNode.ts`, `packages/three/src/domain/services/Three.ts`.

## Acceptance Criteria

- [ ] Shadow maps reduced to 512x512 or disabled on mobile
- [ ] Particle counts reduced by ~50% on mobile
- [ ] devicePixelRatio capped at 2x on mobile
- [ ] Antialiasing disabled on mobile
- [ ] Game runs at 60fps on mid-range mobile devices
- [ ] No visual quality change on desktop

## Notes

- **2026-03-01**: Ticket created.
