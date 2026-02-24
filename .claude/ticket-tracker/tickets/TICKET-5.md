---
id: TICKET-5
title: Built-in follow camera controller
status: open
priority: medium
epic: EPIC-2
created: 2026-02-18
---

# TICKET-5: Built-in follow camera controller

## Problem

Every game built on the engine needs to implement its own camera follow logic. The platformer's `CameraRigNode` is ~40 lines of manual lerp math. This is a common enough pattern that it should be a first-class engine abstraction.

## Acceptance Criteria

- [ ] `useFollowCamera(target, opts)` hook (or equivalent FC) added to `@pulse-ts/three`
- [ ] `opts` supports: `offset` (Vec3), `lookAtOffset` (Vec3), `lerpSpeed` (number), and optionally `lerpMode` ('exponential' | 'linear')
- [ ] Follows the target node's world position each frame
- [ ] Demo's `CameraRigNode.ts` replaced/simplified using the new abstraction
- [ ] JSDoc with `@param`, `@returns`, `@example`
- [ ] Tests cover position tracking and lerp behavior

## Notes

- Consider whether this belongs as a hook (`useFollowCamera`) called inside an existing node, or as a standalone functional component (`FollowCameraNode`) — design to be decided in Phase 3.
- Should work regardless of whether the target uses fixed-step physics or frame-step motion.
