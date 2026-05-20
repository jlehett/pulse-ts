---
id: TICKET-157
title: Wave manager & match flow
status: done
priority: high
created: 2026-05-16
updated: 2026-05-20
depends_on:
  - TICKET-155
  - TICKET-156
labels:
  - lumenwake
  - gameplay
branch: ticket-157-wave-manager-and-match-flow
---

## Description

Implement the wave state machine that drives match progression: 8 regular waves + 1 boss wave, difficulty scaling, darkness consumption (south pole upward), and win/lose conditions.

## Acceptance Criteria

- [x] WaveManagerNode: state machine (IDLE → WAVE_ACTIVE → WAVE_CLEAR → REFRACTION_PICK → next wave or BOSS → VICTORY/DEFEAT)
- [x] Wave composition config: enemy types, counts, spawn timing per wave
- [x] Difficulty scaling: enemies × (0.7 + 0.3 × playerCount)
- [x] Progressive difficulty curve: harder enemy types introduced in later waves
- [x] Darkness consumption: PlanetoidNode.setDarknessLevel() increases each wave (south pole darkness rises)
- [x] Wave transition: brief pause after clear, then Refraction pick phase
- [x] Win condition: survive all 9 waves (8 regular + boss)
- [x] Lose condition: all players dead simultaneously
- [x] Wave counter HUD element
- [x] Match timer display

## Notes

- 2026-05-16: Created. Depends on TICKET-155 (player) and TICKET-156 (enemies) being functional.
- 2026-05-16: Updated — darkness now consumes sphere from south pole upward instead of flat boundary contraction.
- 2026-05-19: Starting implementation.
- 2026-05-20: Completed. Implemented WaveManagerNode with 9-wave progression, wave config with scaling enemy counts and sun strength. Added sun orbit, smooth per-wave brightness transitions (exponential lerp), sun billboard shrinking, starfield background, corona atmosphere, sun-directional enemy lighting, wave/enemy HUD counters, match timer with pulsing separator, and victory/defeat screens.
