---
id: TICKET-044
epic: EPIC-008
title: Network replication — transform sync
status: done
priority: high
branch: ticket-044-network-replication-transform-sync
created: 2026-02-26
updated: 2026-02-28
labels:
  - arena
  - network
  - replication
---

## Description

Wire `useMemory(hub)`, `useRoom('arena')`, `useReplicateTransform({ role:'producer' })` into `LocalPlayerNode`. Create `RemotePlayerNode` with `useReplicateTransform({ role:'consumer' })` as a kinematic sphere. Both canvases now show two balls — local + remote.

## Acceptance Criteria

- [x] `installNetwork` called in `main.ts` before mount
- [x] `useMemory(hub)` and `useRoom('arena')` in ArenaNode
- [x] `useReplicateTransform({ role:'producer' })` in LocalPlayerNode with StableId
- [x] `RemotePlayerNode` created with kinematic sphere rigid body
- [x] `useReplicateTransform({ role:'consumer' })` in RemotePlayerNode with matching StableId
- [x] Both canvases show two balls (local + remote replicated)

## Notes

- **2026-02-26**: Ticket created.
- **2026-02-28**: Starting implementation.
- **2026-02-28**: Complete. MemoryHub created in main.ts, installNetwork called per world, ArenaNode wires useMemory + useRoom. LocalPlayerNode produces transforms via StableId('player-N'), RemotePlayerNode consumes as kinematic sphere with matching ID. Added setupTests.ts for TextEncoder polyfill. 19 passing tests.
