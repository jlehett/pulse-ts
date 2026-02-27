---
id: TICKET-044
epic: EPIC-008
title: Network replication — transform sync
status: todo
priority: high
created: 2026-02-26
updated: 2026-02-26
labels:
  - arena
  - network
  - replication
---

## Description

Wire `useMemory(hub)`, `useRoom('arena')`, `useReplicateTransform({ role:'producer' })` into `LocalPlayerNode`. Create `RemotePlayerNode` with `useReplicateTransform({ role:'consumer' })` as a kinematic sphere. Both canvases now show two balls — local + remote.

## Acceptance Criteria

- [ ] `installNetwork` called in `main.ts` before mount
- [ ] `useMemory(hub)` and `useRoom('arena')` in ArenaNode
- [ ] `useReplicateTransform({ role:'producer' })` in LocalPlayerNode with StableId
- [ ] `RemotePlayerNode` created with kinematic sphere rigid body
- [ ] `useReplicateTransform({ role:'consumer' })` in RemotePlayerNode with matching StableId
- [ ] Both canvases show two balls (local + remote replicated)

## Notes

- **2026-02-26**: Ticket created.
