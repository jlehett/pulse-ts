---
id: TICKET-029
epic: EPIC-004
title: useFollowCamera third-person camera rig
status: done
priority: medium
created: 2026-02-26
updated: 2026-02-26
---

## Description

Add a `useFollowCamera()` hook to `@pulse-ts/three` that provides a smoothed third-person camera following a target node.

API:
```ts
useFollowCamera(targetNode, {
    offset: [0, 8, 12],
    lookAhead: [0, 1, 0],
    smoothing: 4.0,
    interpolate: true,  // auto physics-step interpolation
});
```

Internally handles:
- Fixed-early capture of previous position for interpolation
- Frame-update lerp toward target + offset
- Camera lookAt toward target + lookAhead
- Physics-step interpolation using `world.getAmbientAlpha()`

## Acceptance Criteria

- [ ] `useFollowCamera(target, options)` smoothly follows a target node
- [ ] Configurable offset, look-ahead point, and smoothing factor
- [ ] Automatic physics-step interpolation when `interpolate: true`
- [ ] Full JSDoc with `@param`, `@returns`, `@example`
- [ ] Colocated tests
- [ ] Update platformer demo CameraRigNode to use `useFollowCamera`

## Notes

- **2026-02-26**: Ticket created. CameraRigNode is 70+ lines of manual follow/lerp/interpolation logic.
- **2026-02-26**: Status changed to done. Implemented useFollowCamera with interpolation, exponential-decay smoothing, and lookAt. CameraRigNode reduced from 91 to 42 lines — only shake logic remains.
