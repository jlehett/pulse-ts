---
id: TICKET-108
epic: EPIC-018
title: useStateMachine Hook
status: done
priority: high
branch: ticket-108-use-state-machine
created: 2026-03-13
updated: 2026-03-13
labels:
  - core
  - dx
---

## Description

Implement `useStateMachine` in `@pulse-ts/core` with declarative states supporting
`onEnter`/`onExit`/`onUpdate` callbacks, guard-based automatic transitions, and
`sm.send()` for imperative transitions. One transition per tick, declaration-order
evaluation.

Design doc: `design-docs/approved/010-use-state-machine.md`

## Acceptance Criteria

- [x] `useStateMachine(config)` creates a state machine with typed states
- [x] States support `onEnter`, `onExit`, `onUpdate` callbacks
- [x] Guard-based automatic transitions evaluated each tick
- [x] `sm.send(event)` for imperative transitions
- [x] One transition per tick maximum
- [x] `from` accepts single state or array of states
- [x] `sm.current` exposes current state name
- [x] JSDoc with examples on all public APIs
- [x] Unit tests for transitions, guards, callbacks, edge cases
- [x] Documentation updated

## Notes

- **2026-03-13**: Ticket created from approved design doc #10.
- **2026-03-13**: Implementation complete. Added `stateMachine.ts` with `useStateMachine`, 14 passing tests, docs updated.
