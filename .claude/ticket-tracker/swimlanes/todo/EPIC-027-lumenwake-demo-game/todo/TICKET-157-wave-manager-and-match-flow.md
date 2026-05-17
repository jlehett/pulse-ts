---
id: TICKET-157
title: Wave manager & match flow
status: todo
priority: high
created: 2026-05-16
updated: 2026-05-16
depends_on:
  - TICKET-155
  - TICKET-156
labels:
  - lumenwake
  - gameplay
---

## Description

Implement the wave state machine that drives match progression: 8 regular waves + 1 boss wave, difficulty scaling, darkness consumption (south pole upward), and win/lose conditions.

## Acceptance Criteria

- [ ] WaveManagerNode: state machine (IDLE → WAVE_ACTIVE → WAVE_CLEAR → REFRACTION_PICK → next wave or BOSS → VICTORY/DEFEAT)
- [ ] Wave composition config: enemy types, counts, spawn timing per wave
- [ ] Difficulty scaling: enemies × (0.7 + 0.3 × playerCount)
- [ ] Progressive difficulty curve: harder enemy types introduced in later waves
- [ ] Darkness consumption: PlanetoidNode.setDarknessLevel() increases each wave (south pole darkness rises)
- [ ] Wave transition: brief pause after clear, then Refraction pick phase
- [ ] Win condition: survive all 9 waves (8 regular + boss)
- [ ] Lose condition: all players dead simultaneously
- [ ] Wave counter HUD element
- [ ] Match timer display

## Notes

- 2026-05-16: Created. Depends on TICKET-155 (player) and TICKET-156 (enemies) being functional.
- 2026-05-16: Updated — darkness now consumes sphere from south pole upward instead of flat boundary contraction.
