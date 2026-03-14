---
id: TICKET-134
epic: EPIC-025
title: "Arena migration: effects"
status: in-progress
priority: medium
created: 2026-03-13
updated: 2026-03-13
labels:
  - arena
  - migration
  - effects
---

## Description

Refactor the arena demo to adopt all new `@pulse-ts/effects` improvements:

- **useEffectPool**: Replace manual shockwave pool (`shockwave.ts`, `ShockwaveNode.ts`),
  hit impact tracking (`hitImpact.ts`), and supernova management with `useEffectPool`.
- **useSequence**: Replace manual timer-based sequences in IntroOverlayNode and ReplayNode
  with declarative `useSequence`.
- **useAnimate play callback**: Use `play(onUpdate)` for fire-and-forget animations
  where applicable (score transitions, overlay animations).

## Affected Files

- `shockwave.ts` — replace with useEffectPool
- `ShockwaveNode.ts` — consume effect pool
- `hitImpact.ts` — replace with useEffectPool
- `SupernovaNode.ts` — useEffectPool for supernova effects
- `VictoryEffectNode.ts` — evaluate useEffectPool
- `IntroOverlayNode.ts` — useSequence for intro steps
- `ReplayNode.ts` — useSequence for replay playback
- Various overlay nodes — useAnimate play callback

## Acceptance Criteria

- [ ] Manual effect pool implementations replaced with useEffectPool
- [ ] Time-based sequences replaced with useSequence
- [ ] Fire-and-forget animation pattern uses play(onUpdate) where applicable
- [ ] Module singletons for effects removed (covered by useStore + useEffectPool)
- [ ] All tests pass
- [ ] Lint clean

## Notes

- **2026-03-13**: Ticket created. Depends on EPIC-021 completion.
