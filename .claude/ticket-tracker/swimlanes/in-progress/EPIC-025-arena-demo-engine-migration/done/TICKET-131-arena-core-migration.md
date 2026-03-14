---
id: TICKET-131
epic: EPIC-025
title: "Arena migration: core hooks & utilities"
status: in-progress
priority: high
created: 2026-03-13
updated: 2026-03-14
labels:
  - arena
  - migration
  - core
---

## Description

Refactor the arena demo to adopt all new `@pulse-ts/core` improvements:

- **useStore**: Replace module singletons (`dashCooldown.ts`, `hitImpact.ts`, `playerVelocity.ts`,
  `shockwave.ts`, `replay.ts`, `contexts.ts`) with `defineStore`/`useStore`. Remove manual
  reset calls in GameManagerNode.
- **useWatch**: Replace manual value-change polling (round transitions, phase changes) with
  `useWatch` callbacks.
- **Timer callbacks**: Replace timer polling blocks in GameManagerNode with `onComplete`/`onTick`.
- **`when` guard**: Replace `if (gameState.phase === ...)` guards inside `useFixedUpdate`/`useFrameUpdate`
  with `{ when: () => ... }` option.
- **Math utilities**: Replace inline `lerp`, `clamp`, `smoothstep`, `damp` with engine imports.
- **Noise utilities**: Replace local `noise2D` import with `@pulse-ts/core` noise functions.
- **Color utility**: Replace scattered hex color conversions with `color()`.
- **useStateMachine**: Evaluate whether GameManagerNode's phase management benefits from a state machine.
- **useConditionalChild**: Replace manual conditional child mounting in ArenaNode.

## Affected Files

- `GameManagerNode.ts` — stores, timers, phase guards, state machine candidate
- `dashCooldown.ts`, `hitImpact.ts`, `playerVelocity.ts`, `shockwave.ts` — replace with useStore
- `contexts.ts` — evaluate store vs context usage
- `ArenaNode.ts` — conditional children
- `AtmosphericDustNode.ts` — noise, math utilities
- `LocalPlayerNode.ts`, `AiPlayerNode.ts` — math utilities, when guards
- Multiple overlay nodes — when guards
- `config/arena.ts` — color utility

## Acceptance Criteria

- [ ] All module singletons replaced with useStore
- [ ] Manual reset calls in GameManagerNode removed
- [ ] Timer polling replaced with callbacks
- [ ] Phase guards replaced with `when` option where applicable
- [ ] Inline math replaced with engine utility imports
- [ ] Local noise function replaced with engine import
- [ ] All tests pass
- [ ] Lint clean

## Notes

- **2026-03-13**: Ticket created. Depends on EPIC-018 completion.
