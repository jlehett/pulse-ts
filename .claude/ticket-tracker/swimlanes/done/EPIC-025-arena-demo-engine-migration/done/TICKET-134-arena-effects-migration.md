---
id: TICKET-134
epic: EPIC-025
title: "Arena migration: effects"
status: done
priority: medium
created: 2026-03-13
updated: 2026-03-14
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

- [x] Manual effect pool implementations replaced with useEffectPool
- [x] Time-based sequences replaced with useSequence
- [x] Fire-and-forget animation pattern uses play(onUpdate) where applicable
- [x] Module singletons for effects removed (covered by useStore + useEffectPool)
- [x] All tests pass
- [x] Lint clean

## Notes

- **2026-03-13**: Ticket created. Depends on EPIC-021 completion.
- **2026-03-14**: Implementation complete. Replaced hitImpact and shockwave module singletons with defineStore + useEffectPool. SupernovaNode uses useEffectPool. IntroOverlayNode uses useSequence. ScoreHudNode uses useAnimate play(onUpdate). All affected test files updated with virtual mocks. Tests pass, lint clean.
