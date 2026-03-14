---
id: TICKET-128
epic: EPIC-023
title: useRemoteEntity / useLocalEntity Hooks
status: in-progress
priority: medium
created: 2026-03-13
updated: 2026-03-14
labels:
  - network
  - dx
---

## Description

Implement `useRemoteEntity` and `useLocalEntity` in `@pulse-ts/network` as one-liner
network entity setup hooks. Combines stable ID, transform replication, and interpolation
data access into a single call instead of 3-4 separate hooks.

Design doc: `design-docs/approved/029-use-remote-entity.md`

## Acceptance Criteria

- [ ] `useLocalEntity(stableId, root)` sets up local entity replication
- [ ] `useRemoteEntity(stableId, root)` sets up remote entity with interpolation
- [ ] Returns interpolation data for remote entities
- [ ] Combines useStableId + useReplicateTransform internally
- [ ] Backward compatible — individual hooks still available
- [ ] JSDoc with examples
- [ ] Unit tests
- [ ] Documentation updated

## Notes

- **2026-03-13**: Ticket created from approved design doc #29.
