---
id: TICKET-007
epic: EPIC-001
title: Reduce shadow map cost in platformer
status: todo
priority: medium
created: 2026-02-24
updated: 2026-02-24
---

## Description

Reduce the GPU cost of the directional light shadow map in the platformer demo. Currently using a 2048×2048 PCFSoftShadowMap with a large frustum — dropping resolution and/or shadow type should recover meaningful frame time on GPU-limited machines.

- **File:** `demos/platformer/src/nodes/LevelNode.ts:17-27`
- 2048×2048 shadow map with PCFSoftShadowMap (requires multiple shadow reads per pixel)
- Large light frustum (left: -30, right: 50, top: 20, bottom: -10)
- Options: reduce to 1024×1024, switch to `BasicShadowMap`, or tighten the frustum to fit the visible level area

## Acceptance Criteria

- [ ] Shadow map resolution and/or type reduced
- [ ] FPS overlay (from TICKET-001) confirms measurable improvement
- [ ] Visual quality is still acceptable (shadows visible and not obviously broken)
- [ ] Change is documented with a brief comment explaining the trade-off

## Notes

- **2026-02-24**: Ticket created. Blocked by TICKET-001 (need FPS overlay to confirm improvement). Quick win — visual impact is usually minimal at this scale.
