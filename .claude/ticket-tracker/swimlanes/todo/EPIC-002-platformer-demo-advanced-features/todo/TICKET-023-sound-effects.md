---
id: TICKET-023
epic: EPIC-002
title: Sound effects (jump, collect, land, dash)
status: todo
priority: low
branch: ticket-023-sound-effects
created: 2026-02-25
updated: 2026-02-26
---

## Description

Add basic sound effects using the Web Audio API (no external library). Generate simple synthesized sounds procedurally so no audio assets are needed.

Sounds needed:
- **Jump**: short rising tone (~80 ms)
- **Collect**: pleasant chime or arpeggio (~200 ms)
- **Land**: soft thud (low frequency noise burst, ~100 ms)
- **Dash**: whoosh (filtered noise sweep, ~150 ms)
- **Enemy kill / hazard death**: descending tone (~200 ms)

Implementation:
- A small `audio.ts` utility in the demo (`src/utils/audio.ts`) wrapping Web Audio API
- Each sound is a function that creates and immediately plays a short oscillator/buffer node
- AudioContext created lazily on first user interaction (browser autoplay policy)

This ticket will inform whether a `@pulse-ts/audio` package makes sense in a future engine pass.

## Acceptance Criteria

- [ ] All 5 sounds play at the correct game events
- [ ] No audio assets required (all synthesized)
- [ ] AudioContext respects browser autoplay policy (created after first interaction)
- [ ] Sounds are short and non-intrusive

## Notes

- **2026-02-25**: Ticket created. Polish pass — implement last.
