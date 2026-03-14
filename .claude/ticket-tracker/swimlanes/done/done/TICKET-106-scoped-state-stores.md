---
id: TICKET-106
epic: EPIC-018
title: Scoped State Stores (defineStore / useStore)
status: done
priority: high
branch: ticket-106-scoped-state-stores
created: 2026-03-13
updated: 2026-03-13
labels:
  - core
  - dx
---

## Description

Implement `defineStore` and `useStore` in `@pulse-ts/core` for world-scoped shared state
with a setter pattern (`[state, setState]`). Stores are lazy-created on first access,
singleton per world, and automatically cleaned up on world destroy.

Complementary to existing `useContext` (node-scoped). `useStore` is for world-level
shared state (scores, game phase, settings).

Design doc: `design-docs/approved/004-scoped-state-stores.md`

## Acceptance Criteria

- [x] `defineStore(name, initializer)` creates a store definition
- [x] `useStore(StoreDef)` returns `[state, setState]` tuple
- [x] Store is lazy-created on first `useStore` call
- [x] Store is singleton per world (same reference across nodes)
- [x] Store is automatically cleaned up on world destroy
- [x] `setState` accepts partial updates or updater function
- [x] JSDoc with examples on all public APIs
- [x] Unit tests for creation, access, cleanup, partial updates
- [x] Documentation updated

## Notes

- **2026-03-13**: Ticket created from approved design doc #4.
- **2026-03-13**: Implementation complete. Added `stores.ts` with `defineStore`/`useStore`, integrated `clearStores` into `World.destroy()`, 12 passing tests, state management guide added to docs.
