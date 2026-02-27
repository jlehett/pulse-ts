---
id: TICKET-039
title: Remove camera shake from platformer demo
status: in-progress
priority: low
created: 2026-02-26
updated: 2026-02-26
labels: platformer,cleanup
---

## Description

Remove the camera shake feature entirely from the platformer demo. The effect is not liked and should be stripped out.

## Scope

- Remove `ShakeState` interface and shake constants from `PlayerNode.ts`
- Remove shake trigger logic from `PlayerNode.ts`
- Remove `ShakeCtx` from `contexts.ts`
- Strip shake logic from `CameraRigNode.ts` (keep follow camera)
- Remove shake state init and context provision from `LevelNode.ts`
- Update related tests

## Notes

- **2026-02-26**: Starting implementation.
