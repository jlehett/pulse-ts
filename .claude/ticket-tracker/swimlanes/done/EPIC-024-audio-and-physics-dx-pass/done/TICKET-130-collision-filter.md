---
id: TICKET-130
epic: EPIC-024
title: Collision Filter Option
status: done
priority: medium
created: 2026-03-13
updated: 2026-03-14
labels:
  - physics
  - dx
---

## Description

Add an optional `filter` parameter to `useOnCollisionStart`, `useOnCollisionEnd`, and
`useOnCollision` in `@pulse-ts/physics`. Accepts either a component constructor
(shorthand for "other node has this component") or a predicate function for complex
filtering logic.

Design doc: `design-docs/approved/040-collision-filter.md`

## Acceptance Criteria

- [x] `filter: ComponentType` shorthand — callback only fires if other node has the component
- [x] `filter: (other) => boolean` predicate — callback only fires if predicate returns true
- [x] Type: `CollisionFilter = ComponentType | ((other: Node) => boolean)`
- [x] Applied to all three hooks: useOnCollisionStart, useOnCollisionEnd, useOnCollision
- [x] Options object: `{ filter?: CollisionFilter }` (extensible for future options)
- [x] Backward compatible — filter is optional
- [x] JSDoc with examples
- [x] Unit tests for component shorthand and predicate filter
- [x] Documentation updated

## Notes

- **2026-03-13**: Ticket created from approved design doc #40.
