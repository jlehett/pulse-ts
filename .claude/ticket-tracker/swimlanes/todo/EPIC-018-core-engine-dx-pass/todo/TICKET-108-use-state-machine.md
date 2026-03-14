---
id: TICKET-108
epic: EPIC-018
title: useStateMachine Hook
status: todo
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

- [ ] `useStateMachine(config)` creates a state machine with typed states
- [ ] States support `onEnter`, `onExit`, `onUpdate` callbacks
- [ ] Guard-based automatic transitions evaluated each tick
- [ ] `sm.send(event)` for imperative transitions
- [ ] One transition per tick maximum
- [ ] `from` accepts single state or array of states
- [ ] `sm.current` exposes current state name
- [ ] JSDoc with examples on all public APIs
- [ ] Unit tests for transitions, guards, callbacks, edge cases
- [ ] Documentation updated

## Notes

- **2026-03-13**: Ticket created from approved design doc #10.
