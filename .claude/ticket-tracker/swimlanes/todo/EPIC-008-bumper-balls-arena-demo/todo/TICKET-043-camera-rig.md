---
id: TICKET-043
epic: EPIC-008
title: Camera rig
status: todo
priority: medium
created: 2026-02-26
updated: 2026-02-26
labels:
  - arena
  - camera
---

## Description

`CameraRigNode` — `useFollowCamera` tracking the local player from an elevated rear angle. Each world follows its own player independently.

## Acceptance Criteria

- [ ] `CameraRigNode` uses `useFollowCamera` targeting the local player node
- [ ] Elevated rear angle offset appropriate for arena top-down-ish view
- [ ] Each world's camera independently follows its own local player
- [ ] Camera rig mounted as child of ArenaNode

## Notes

- **2026-02-26**: Ticket created.
