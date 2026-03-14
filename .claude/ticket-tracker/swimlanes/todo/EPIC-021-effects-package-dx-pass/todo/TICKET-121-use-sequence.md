---
id: TICKET-121
epic: EPIC-021
title: useSequence Hook
status: todo
priority: medium
created: 2026-03-13
updated: 2026-03-13
labels:
  - effects
  - dx
---

## Description

Implement `useSequence` in `@pulse-ts/effects` for time-based action sequences with
`pre`/`post` delays per step and parallel sub-sequences. Independent from state machine —
can be composed with it.

Design doc: `design-docs/approved/012-use-sequence.md`

## Acceptance Criteria

- [ ] `useSequence(steps)` creates a controllable sequence
- [ ] Steps support `pre` delay, `action` callback, and `post` delay
- [ ] Parallel sub-sequences via `{ parallel: SequenceStep[] }`
- [ ] `sequence.play()` starts from beginning
- [ ] `sequence.finished` indicates completion
- [ ] Sequence respects fixed-tick timing
- [ ] JSDoc with examples
- [ ] Unit tests for sequential steps, parallel, delays, completion
- [ ] Documentation updated

## Notes

- **2026-03-13**: Ticket created from approved design doc #12.
