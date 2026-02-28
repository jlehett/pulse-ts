---
id: TICKET-043
epic: EPIC-008
title: Camera rig
status: done
priority: medium
branch: ticket-043-camera-rig
created: 2026-02-26
updated: 2026-02-28
labels:
  - arena
  - camera
---

## Description

`CameraRigNode` — `useFollowCamera` tracking the local player from an elevated rear angle. Each world follows its own player independently.

## Acceptance Criteria

- [x] `CameraRigNode` uses `useFollowCamera` targeting the local player node
- [x] Elevated rear angle offset appropriate for arena top-down-ish view
- [x] Each world's camera independently follows its own local player
- [x] Camera rig mounted as child of ArenaNode

## Notes

- **2026-02-26**: Ticket created.
- **2026-02-28**: Starting implementation.
- **2026-02-28**: Complete. Camera at offset [0, 18, 10] with smoothing 6 and interpolation. 3 passing tests.
